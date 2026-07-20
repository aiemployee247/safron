// Pit Board — the read-only data layer + static host for Mission Control.
// Opens the logbook in READONLY mode, so a flaky dashboard can never corrupt
// the crew's state. Binds to localhost only; expose it privately per the tutorial.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(here, "..", "logbook.db");
const PORT = Number(process.env.BOARD_PORT || 8787);

// READONLY: the board reads; it never writes.
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

function json(res, body) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
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
  console.log(`Pit Board on http://127.0.0.1:${PORT} (read-only)`);
});
