// Shared append-only logbook. Every agent calls append() for meaningful
// actions; the Pit Board reads the same file (read-only) to render live state.
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(here, "logbook.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL DEFAULT (datetime('now')),
    agent TEXT NOT NULL,
    kind TEXT NOT NULL,
    summary TEXT NOT NULL,
    detail TEXT
  );
`);

const insert = db.prepare(
  "INSERT INTO events (agent, kind, summary, detail) VALUES (?, ?, ?, ?)",
);

// kind: started | finished | handoff | error | note
export function append(agent, kind, summary, detail = null) {
  insert.run(agent, kind, String(summary).slice(0, 500), detail);
}
