// Pit Board — the read-only data layer + static host. It opens the logbook in
// READONLY mode, so a flaky dashboard can never corrupt the crew's state.
// Binds to localhost only; expose it privately (Tailscale) per the tutorial.
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

const qLastByAgent = db.prepare(
  "SELECT agent, MAX(ts) AS last_ts FROM events GROUP BY agent",
);
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

function agents() {
  const last = Object.fromEntries(qLastByAgent.all().map((r) => [r.agent, r.last_ts]));
  const active = new Set(qActive.all(ACTIVE_WINDOW).map((r) => r.agent));
  return AGENTS.map((a) => ({
    agent: a,
    lastActivity: last[a] ?? null,
    status: active.has(a) ? "active" : "idle",
  }));
}

function json(res, body) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname === "/api/agents") return json(res, agents());
    if (url.pathname === "/api/events") {
      const limit = Math.min(Number(url.searchParams.get("limit") || 40), 200);
      return json(res, qRecent.all(limit));
    }
    if (url.pathname === "/api/tasks") return json(res, qOpenTasks.all());
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
