// Pit Board — the read-only data layer + static host for Mission Control.
// Opens the logbook in READONLY mode, so a flaky dashboard can never corrupt
// the crew's state. Binds to localhost only; expose it privately per the tutorial.
//
// Several pieces of writable local state live outside the logbook, entirely
// separate from what the fleet depends on: the kanban board (kanban.json),
// the docs browser (content/<agent>/*.md|*.txt), and chat history
// (chat/<agent>.json). Chat additionally calls Anthropic directly to run a
// real turn — those turns are logged to their own file, never to the fleet's
// logbook.db, so a chat session can never be mistaken for real Telegram
// activity in the fleet's own stats.
import { createServer } from "node:http";
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFile, execFileSync } from "node:child_process";
import os from "node:os";
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

import { AGENTS, AGENT_KEYS } from "../agents.js";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const DB_PATH = join(ROOT, "logbook.db");
const KANBAN_PATH = join(ROOT, "kanban.json");
const CONTENT_DIR = join(ROOT, "content");
const CHAT_DIR = join(ROOT, "chat");
const PORT = Number(process.env.BOARD_PORT || 8787);
const MODEL = process.env.PIT_CREW_MODEL || "claude-sonnet-5";

if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });
if (!existsSync(CHAT_DIR)) mkdirSync(CHAT_DIR, { recursive: true });
for (const key of AGENT_KEYS) {
  const dir = join(CONTENT_DIR, key);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// The fleet process creates logbook.db on its own first boot (via logbook.js).
// When both processes are launched together (systemd/launchd start them at
// roughly the same time), the board can win the race and start before that
// file exists. Wait briefly rather than crash — the service manager would
// otherwise just restart us into the same race repeatedly.
function waitForLogbook(timeoutMs = 20_000) {
  const start = Date.now();
  while (!existsSync(DB_PATH)) {
    if (Date.now() - start > timeoutMs) {
      console.error(`logbook.db not found at ${DB_PATH} after ${timeoutMs}ms — is the fleet running?`);
      process.exit(1);
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }
}
waitForLogbook();

// READONLY: the board reads the crew's own logbook; it never writes to it.
const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

const ACTIVE_WINDOW = "-5 minutes";
const ROLES = Object.fromEntries(AGENT_KEYS.map((k) => [k, AGENTS[k].role]));

const qLastByAgent = db.prepare("SELECT agent, MAX(ts) AS last_ts FROM events GROUP BY agent");
const qActive = db.prepare(
  `SELECT agent FROM events WHERE ts >= datetime('now', ?) GROUP BY agent`,
);
const qRecent = db.prepare(
  "SELECT ts, agent, kind, summary FROM events ORDER BY id DESC LIMIT ?",
);
const qOpenTasks = db.prepare(
  `SELECT agent, summary, ts FROM events e
   WHERE kind = 'started'
     AND NOT EXISTS (
       SELECT 1 FROM events f
       WHERE f.kind = 'finished' AND f.agent = e.agent
         AND f.summary = e.summary AND f.id > e.id
     )
   ORDER BY e.id DESC LIMIT 20`,
);
const qDoneToday = db.prepare(
  `SELECT agent, summary, ts FROM events
   WHERE kind = 'finished' AND ts >= datetime('now','start of day')
   ORDER BY id DESC LIMIT 20`,
);
// Per-agent turn counts + token/cost totals (from the JSON detail on 'finished').
const qPerAgent = db.prepare(
  `SELECT agent,
          COUNT(*) AS turns,
          COALESCE(SUM(json_extract(detail,'$.in')), 0)  AS tok_in,
          COALESCE(SUM(json_extract(detail,'$.out')), 0) AS tok_out,
          COALESCE(SUM(json_extract(detail,'$.cost')), 0) AS cost
   FROM events WHERE kind = 'finished' GROUP BY agent`,
);
const qTotals = db.prepare(
  `SELECT
     (SELECT COUNT(*) FROM events WHERE kind='finished') AS turns_total,
     (SELECT COUNT(*) FROM events WHERE kind='finished' AND ts >= datetime('now','start of day')) AS turns_today,
     (SELECT COUNT(*) FROM events WHERE kind='error'    AND ts >= datetime('now','start of day')) AS errors_today,
     (SELECT COALESCE(SUM(json_extract(detail,'$.cost')),0) FROM events WHERE kind='finished') AS cost_total,
     (SELECT COALESCE(SUM(json_extract(detail,'$.cost')),0) FROM events WHERE kind='finished' AND ts >= datetime('now','start of day')) AS cost_today,
     (SELECT COALESCE(SUM(json_extract(detail,'$.in')),0)  FROM events WHERE kind='finished' AND ts >= datetime('now','start of day')) AS tok_in_today,
     (SELECT COALESCE(SUM(json_extract(detail,'$.out')),0) FROM events WHERE kind='finished' AND ts >= datetime('now','start of day')) AS tok_out_today`,
);
const qModel = db.prepare(
  `SELECT json_extract(detail,'$.model') AS model FROM events
   WHERE kind='finished' AND detail IS NOT NULL ORDER BY id DESC LIMIT 1`,
);
const qAgentEvents = db.prepare(
  `SELECT ts, kind, summary, detail FROM events WHERE agent = ? ORDER BY id DESC LIMIT ?`,
);
const qAgentLastError = db.prepare(
  `SELECT ts, summary FROM events WHERE agent = ? AND kind = 'error' ORDER BY id DESC LIMIT 1`,
);

function agentsView() {
  const last = Object.fromEntries(qLastByAgent.all().map((r) => [r.agent, r.last_ts]));
  const active = new Set(qActive.all(ACTIVE_WINDOW).map((r) => r.agent));
  const perAgent = Object.fromEntries(qPerAgent.all().map((r) => [r.agent, r]));
  return AGENT_KEYS.map((a) => ({
    agent: a,
    name: AGENTS[a].name,
    lastActivity: last[a] ?? null,
    status: active.has(a) ? "active" : "idle",
    turns: perAgent[a]?.turns ?? 0,
    cost: perAgent[a]?.cost ?? 0,
    tokIn: perAgent[a]?.tok_in ?? 0,
    tokOut: perAgent[a]?.tok_out ?? 0,
  }));
}

function agentDetail(key) {
  if (!AGENT_KEYS.includes(key)) return null;
  const events = qAgentEvents.all(key, 200);
  const finished = events.filter((e) => e.kind === "finished");
  const modelCounts = {};
  let cost = 0, tokIn = 0, tokOut = 0;
  for (const e of finished) {
    let d = {};
    try { d = JSON.parse(e.detail || "{}"); } catch { /* ignore malformed detail */ }
    if (d.model) modelCounts[d.model] = (modelCounts[d.model] || 0) + 1;
    cost += Number(d.cost) || 0;
    tokIn += Number(d.in) || 0;
    tokOut += Number(d.out) || 0;
  }
  const errors = events.filter((e) => e.kind === "error").length;
  const lastError = qAgentLastError.get(key);
  return {
    agent: key,
    name: AGENTS[key].name,
    role: AGENTS[key].role,
    system: AGENTS[key].system,
    turns: finished.length,
    errors,
    successRate: finished.length + errors > 0 ? Math.round((finished.length / (finished.length + errors)) * 100) : 100,
    cost, tokIn, tokOut,
    models: Object.entries(modelCounts).map(([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count),
    recent: events.slice(0, 15).map((e) => ({ ts: e.ts, kind: e.kind, summary: e.summary })),
    lastError: lastError ? { ts: lastError.ts, summary: lastError.summary } : null,
  };
}

function statsView() {
  const t = qTotals.get();
  const active = qActive.all(ACTIVE_WINDOW).length;
  return {
    agentsTotal: AGENT_KEYS.length,
    agentsActive: active,
    turnsToday: t.turns_today,
    turnsTotal: t.turns_total,
    errorsToday: t.errors_today,
    costToday: t.cost_today,
    costTotal: t.cost_total,
    tokInToday: t.tok_in_today,
    tokOutToday: t.tok_out_today,
    model: qModel.get()?.model ?? null,
  };
}

// ---------------------------------------------------------------------------
// Host — local machine health. Cross-platform (os module works on macOS and
// Linux identically); the scheduled-jobs list is the one OS-aware piece.
// ---------------------------------------------------------------------------
function hostView() {
  const total = os.totalmem();
  const free = os.freemem();
  return {
    platform: process.platform, // "darwin" | "linux"
    hostname: os.hostname(),
    uptimeSec: Math.round(os.uptime()),
    cpuCount: os.cpus().length,
    loadAvg: os.loadavg(), // [1m, 5m, 15m] — 0s on Windows, harmless here
    memTotal: total,
    memUsed: total - free,
    nodeVersion: process.version,
  };
}

function jobsView() {
  try {
    if (process.platform === "darwin") {
      const out = execFileSync("launchctl", ["list"], { encoding: "utf8", timeout: 4000 });
      return out
        .split("\n")
        .slice(1)
        .map((l) => l.trim().split(/\s+/))
        .filter((cols) => cols[2] && cols[2].toLowerCase().includes("agentgarage"))
        .map(([pid, status, label]) => ({ label, pid: pid === "-" ? null : Number(pid), status }));
    }
    if (process.platform === "linux") {
      const out = execFileSync(
        "systemctl",
        ["list-units", "--type=service", "--all", "--no-legend", "--no-pager"],
        { encoding: "utf8", timeout: 4000 },
      );
      return out
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && /pit-crew|agent-garage/i.test(l))
        .map((l) => {
          const [unit, load, active, sub, ...rest] = l.split(/\s+/);
          return { label: unit, load, active, sub, description: rest.join(" ") };
        });
    }
  } catch {
    // launchctl/systemctl missing or errored — report no jobs rather than fail.
  }
  return [];
}

// ---------------------------------------------------------------------------
// Service control — restart/stop/start the crew's OWN services, and only
// those. Strict allowlist, exact match, no string concatenation into a
// shell — mirrors the safe-restart pattern from the Telegram Ops Bot
// tutorial. This is the closest honest equivalent of "schedule" for a system
// that has two long-running services rather than a cron subsystem.
// ---------------------------------------------------------------------------
const SERVICE_UNITS = {
  linux: { fleet: "pit-crew-fleet", board: "pit-crew-board" },
  darwin: { fleet: "com.agentgarage.pitcrew.fleet", board: "com.agentgarage.pitcrew.board" },
};
function serviceAction(name, action) {
  return new Promise((resolve) => {
    const units = SERVICE_UNITS[process.platform];
    if (!units || !units[name]) return resolve({ ok: false, error: "unsupported platform" });
    if (!["start", "stop", "restart"].includes(action)) return resolve({ ok: false, error: "bad action" });
    const unit = units[name];
    let cmd, args;
    if (process.platform === "linux") {
      cmd = "sudo"; args = ["systemctl", action, unit];
    } else {
      // launchd has no single "restart" verb; unload+load approximates it.
      cmd = "launchctl";
      args = action === "stop" ? ["unload", `${process.env.HOME}/Library/LaunchAgents/${unit}.plist`]
        : action === "start" ? ["load", "-w", `${process.env.HOME}/Library/LaunchAgents/${unit}.plist`]
        : null;
    }
    if (process.platform === "darwin" && action === "restart") {
      const plist = `${process.env.HOME}/Library/LaunchAgents/${unit}.plist`;
      execFile("launchctl", ["unload", plist], () => {
        execFile("launchctl", ["load", "-w", plist], (err) => {
          resolve(err ? { ok: false, error: err.message } : { ok: true });
        });
      });
      return;
    }
    if (!cmd) return resolve({ ok: false, error: "unsupported action" });
    execFile(cmd, args, { timeout: 10_000 }, (err) => {
      resolve(err ? { ok: false, error: err.message } : { ok: true });
    });
  });
}

// ---------------------------------------------------------------------------
// Kanban — a tiny file-backed board. Not tied to the fleet; just a place for
// the human running the crew to jot down what's queued, in flight, and done.
// ---------------------------------------------------------------------------
function loadKanban() {
  if (!existsSync(KANBAN_PATH)) {
    const seed = { todo: [], doing: [], done: [] };
    writeFileSync(KANBAN_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    return JSON.parse(readFileSync(KANBAN_PATH, "utf8"));
  } catch {
    return { todo: [], doing: [], done: [] };
  }
}
function saveKanban(board) {
  writeFileSync(KANBAN_PATH, JSON.stringify(board, null, 2));
}
const KANBAN_COLUMNS = new Set(["todo", "doing", "done"]);
const PRIORITIES = new Set(["P1", "P2", "P3"]);

// ---------------------------------------------------------------------------
// Content browser — per-agent folders of plain Markdown/text files.
// Filenames are validated against a strict allowlist so nothing can escape
// its folder or execute.
// ---------------------------------------------------------------------------
function safeDocName(raw) {
  const name = String(raw || "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.(md|txt)$/.test(name)) return null;
  if (name.includes("..")) return null;
  return name;
}
function safeAgentKey(raw) {
  return AGENT_KEYS.includes(raw) ? raw : null;
}

function contentList() {
  const out = [];
  for (const agent of AGENT_KEYS) {
    const dir = join(CONTENT_DIR, agent);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!safeDocName(f)) continue;
      const s = statSync(join(dir, f));
      out.push({ agent, file: f, size: s.size, modified: s.mtime.toISOString() });
    }
  }
  return out.sort((a, b) => (a.modified < b.modified ? 1 : -1));
}

function json(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Chat — a real conversation with any one agent, run right from the
// dashboard. Every send is a genuine model turn (same charter each agent
// uses on Telegram), threaded against that agent's own saved history.
// History lives in chat/<agent>.json — entirely separate from logbook.db,
// so a dashboard chat session is never confused with real fleet activity in
// the Command Center's stats.
// ---------------------------------------------------------------------------
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

function chatPath(agent) {
  return join(CHAT_DIR, `${agent}.json`);
}
function loadChat(agent) {
  const fp = chatPath(agent);
  if (!existsSync(fp)) return [];
  try { return JSON.parse(readFileSync(fp, "utf8")); } catch { return []; }
}
function saveChat(agent, messages) {
  writeFileSync(chatPath(agent), JSON.stringify(messages.slice(-60), null, 2));
}

async function sendChat(agent, text) {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY is not set");
  const history = loadChat(agent);
  const userMsg = { role: "user", content: text, ts: new Date().toISOString() };
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: AGENTS[agent].system,
    messages: [...history, userMsg].map((m) => ({ role: m.role, content: m.content })),
  });
  const reply = res.content.find((b) => b.type === "text")?.text ?? "(no response)";
  const assistantMsg = { role: "assistant", content: reply, ts: new Date().toISOString() };
  saveChat(agent, [...history, userMsg, assistantMsg]);
  return assistantMsg;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname === "/api/agents") return json(res, agentsView());
    if (url.pathname === "/api/agent") {
      const key = safeAgentKey(url.searchParams.get("key"));
      if (!key) return json(res, { error: "unknown agent" }, 404);
      return json(res, agentDetail(key));
    }
    if (url.pathname === "/api/stats") return json(res, statsView());
    if (url.pathname === "/api/events") {
      const limit = Math.min(Number(url.searchParams.get("limit") || 40), 200);
      return json(res, qRecent.all(limit));
    }
    if (url.pathname === "/api/tasks") {
      return json(res, { open: qOpenTasks.all(), done: qDoneToday.all() });
    }

    if (url.pathname === "/api/host") {
      return json(res, { ...hostView(), jobs: jobsView() });
    }
    if (url.pathname === "/api/service" && req.method === "POST") {
      const { name, action } = JSON.parse((await readBody(req)) || "{}");
      const result = await serviceAction(name, action);
      return json(res, result, result.ok ? 200 : 400);
    }

    if (url.pathname === "/api/roster") {
      return json(res, AGENT_KEYS.map((k) => ({ key: k, name: AGENTS[k].name, role: AGENTS[k].role })));
    }
    if (url.pathname === "/api/chat") {
      const key = safeAgentKey(url.searchParams.get("agent"));
      if (req.method === "GET") {
        if (!key) return json(res, { error: "unknown agent" }, 400);
        return json(res, loadChat(key));
      }
      if (req.method === "POST") {
        const body = JSON.parse((await readBody(req)) || "{}");
        const agent = safeAgentKey(body.agent);
        const text = String(body.message || "").trim().slice(0, 4000);
        if (!agent || !text) return json(res, { error: "agent and message are required" }, 400);
        try {
          const reply = await sendChat(agent, text);
          return json(res, { ok: true, reply });
        } catch (err) {
          return json(res, { ok: false, error: err.message }, 502);
        }
      }
      if (req.method === "DELETE") {
        if (!key) return json(res, { error: "unknown agent" }, 400);
        saveChat(key, []);
        return json(res, { ok: true });
      }
    }

    if (url.pathname === "/api/kanban") {
      if (req.method === "GET") return json(res, loadKanban());
      if (req.method === "POST") {
        const body = JSON.parse((await readBody(req)) || "{}");
        const board = loadKanban();
        if (body.action === "add" && KANBAN_COLUMNS.has(body.column) && body.text) {
          board[body.column].push({
            id: Date.now().toString(36),
            text: String(body.text).slice(0, 200),
            priority: PRIORITIES.has(body.priority) ? body.priority : "P3",
          });
        } else if (body.action === "move" && KANBAN_COLUMNS.has(body.to) && body.id) {
          for (const col of KANBAN_COLUMNS) {
            const i = board[col].findIndex((c) => c.id === body.id);
            if (i !== -1) {
              const [card] = board[col].splice(i, 1);
              board[body.to].push(card);
              break;
            }
          }
        } else if (body.action === "delete" && body.id) {
          for (const col of KANBAN_COLUMNS) {
            board[col] = board[col].filter((c) => c.id !== body.id);
          }
        } else {
          return json(res, { error: "bad request" }, 400);
        }
        saveKanban(board);
        return json(res, board);
      }
    }

    if (url.pathname === "/api/content") {
      if (req.method === "GET" && !url.searchParams.get("file")) {
        return json(res, contentList());
      }
      const agent = safeAgentKey(url.searchParams.get("agent"));
      const name = safeDocName(url.searchParams.get("file"));
      if (!agent || !name) return json(res, { error: "invalid agent or filename" }, 400);
      const fp = join(CONTENT_DIR, agent, name);
      if (req.method === "GET") {
        if (!existsSync(fp)) return json(res, { error: "not found" }, 404);
        return json(res, { agent, file: name, body: readFileSync(fp, "utf8") });
      }
      if (req.method === "POST") {
        const { body = "" } = JSON.parse((await readBody(req)) || "{}");
        writeFileSync(fp, String(body).slice(0, 200_000));
        return json(res, { ok: true });
      }
      if (req.method === "DELETE") {
        if (existsSync(fp)) unlinkSync(fp);
        return json(res, { ok: true });
      }
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(readFileSync(join(here, "index.html")));
    }
    res.writeHead(404).end("not found");
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Pit Board on http://127.0.0.1:${PORT} (read-only fleet data; kanban/content/chat are locally writable)`);
});
