// Pit Board — the read-only data layer + static host for Mission Control.
// Opens the logbook in READONLY mode, so a flaky dashboard can never corrupt
// the crew's state. Binds to localhost only; expose it privately per the tutorial.
//
// Two small pieces of writable local state live outside the logbook: the
// kanban board (kanban.json) and the docs browser (content/*.md|*.txt). Both
// are plain files the crew doesn't touch, so writing to them can't corrupt
// anything the fleet depends on.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";
import Database from "better-sqlite3";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const DB_PATH = join(ROOT, "logbook.db");
const KANBAN_PATH = join(ROOT, "kanban.json");
const CONTENT_DIR = join(ROOT, "content");
const PORT = Number(process.env.BOARD_PORT || 8787);

if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

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
const AGENTS = ["foreman", "radar", "quill", "wrench", "ledger"];

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

function agentsView() {
  const last = Object.fromEntries(qLastByAgent.all().map((r) => [r.agent, r.last_ts]));
  const active = new Set(qActive.all(ACTIVE_WINDOW).map((r) => r.agent));
  const perAgent = Object.fromEntries(qPerAgent.all().map((r) => [r.agent, r]));
  return AGENTS.map((a) => ({
    agent: a,
    lastActivity: last[a] ?? null,
    status: active.has(a) ? "active" : "idle",
    turns: perAgent[a]?.turns ?? 0,
    cost: perAgent[a]?.cost ?? 0,
    tokIn: perAgent[a]?.tok_in ?? 0,
    tokOut: perAgent[a]?.tok_out ?? 0,
  }));
}

function statsView() {
  const t = qTotals.get();
  const active = qActive.all(ACTIVE_WINDOW).length;
  return {
    agentsTotal: AGENTS.length,
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

// Best-effort scheduled-job listing. Never throws — an unavailable tool just
// yields an empty list, since this is informational only.
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

// ---------------------------------------------------------------------------
// Content browser — a small sandboxed notes area. Filenames are validated
// against a strict allowlist so nothing can escape CONTENT_DIR or execute.
// ---------------------------------------------------------------------------
function safeDocName(raw) {
  const name = String(raw || "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.(md|txt)$/.test(name)) return null;
  if (name.includes("..")) return null;
  return name;
}

function contentList() {
  return readdirSync(CONTENT_DIR)
    .filter((f) => safeDocName(f))
    .map((f) => {
      const s = statSync(join(CONTENT_DIR, f));
      return { file: f, size: s.size, modified: s.mtime.toISOString() };
    })
    .sort((a, b) => (a.modified < b.modified ? 1 : -1));
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname === "/api/agents") return json(res, agentsView());
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

    if (url.pathname === "/api/kanban") {
      if (req.method === "GET") return json(res, loadKanban());
      if (req.method === "POST") {
        const body = JSON.parse((await readBody(req)) || "{}");
        const board = loadKanban();
        if (body.action === "add" && KANBAN_COLUMNS.has(body.column) && body.text) {
          board[body.column].push({ id: Date.now().toString(36), text: String(body.text).slice(0, 200) });
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
      const name = safeDocName(url.searchParams.get("file"));
      if (!name) return json(res, { error: "invalid filename" }, 400);
      const fp = join(CONTENT_DIR, name);
      if (req.method === "GET") {
        if (!existsSync(fp)) return json(res, { error: "not found" }, 404);
        return json(res, { file: name, body: readFileSync(fp, "utf8") });
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
  console.log(`Pit Board on http://127.0.0.1:${PORT} (read-only fleet data; kanban + docs are locally writable)`);
});
