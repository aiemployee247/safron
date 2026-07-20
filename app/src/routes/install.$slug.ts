import { createFileRoute } from '@tanstack/react-router'

// One-line auto-installer scripts, keyed by tutorial slug. The script URL is
// only revealed to members on the /install page, but the script itself must be
// publicly curl-able (a fresh VPS has no session cookie).
const installers: Record<string, string> = {
  'pit-crew-mission-control': String.raw`#!/usr/bin/env bash
# Agent Garage auto-installer — Pit Crew (5-agent Telegram fleet + Pit Board)
# https://agent-garage.higgsfield.app/tutorials/pit-crew-mission-control
# Scaffolds the whole project so the tutorial's prompts have a real home to
# build into. Run on a fresh Debian/Ubuntu box as a sudo-capable user.
set -euo pipefail

echo "== Agent Garage — Pit Crew installer =="
echo "This scaffolds the project structure, dependencies, and config."
echo "You'll finish wiring the agents by pasting the tutorial's prompts into"
echo "your coding agent afterwards."
echo ""

# --- dependencies -----------------------------------------------------------
command -v node >/dev/null 2>&1 || {
  echo "Node.js not found. Installing Node 20 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
}
command -v python3 >/dev/null 2>&1 || sudo apt-get install -y python3 python3-pip
command -v sqlite3 >/dev/null 2>&1 || sudo apt-get install -y sqlite3

# --- config -----------------------------------------------------------------
read -rp "Telegram bot token (from @BotFather): " BOT_TOKEN
read -rp "Your numeric Telegram user id (from @userinfobot): " OWNER_ID
read -rp "Anthropic API key (sk-ant-...): " ANTHROPIC_API_KEY
[ -n "$BOT_TOKEN" ] && [ -n "$OWNER_ID" ] || { echo "Bot token and owner id are required."; exit 1; }

ROOT=/opt/pit-crew
sudo mkdir -p "$ROOT"
sudo chown "$USER" "$ROOT"
cd "$ROOT"

# --- directory layout: one workspace per agent ------------------------------
for agent in foreman radar quill wrench ledger board archive; do
  mkdir -p "$ROOT/$agent"
done

cat > .env <<EOF
BOT_TOKEN=$BOT_TOKEN
OWNER_ID=$OWNER_ID
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
EOF
chmod 600 .env

# --- shared operating rules (Prompt 3 writes the real ones; this is a stub) --
cat > RULES.md <<'EOF'
# Pit Crew — operating rules (stub)
# The tutorial's Prompt 3 replaces this with your finished rules.
1. Plans before actions on anything multi-step; wait for the owner's go-ahead.
2. One short status line per step: [agent] step x/y — what.
3. Failed means failed, with the error shown. No invented results.
4. Cross-agent work always routes through the Foreman.
5. Lead with the result, not the preamble.
EOF

# --- routing map (Prompt 8 fills in the real thread ids) --------------------
cat > routing.json <<'EOF'
{
  "_comment": "Fill each thread id from your Telegram topics (Prompt 8).",
  "threads": { "foreman": 0, "radar": 0, "quill": 0, "wrench": 0, "ledger": 0 }
}
EOF

# --- shared logbook (Prompt 10 uses this schema) ----------------------------
sqlite3 "$ROOT/logbook.db" <<'EOF'
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  agent TEXT NOT NULL,
  kind TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail TEXT
);
INSERT INTO events (agent, kind, summary) VALUES ('installer', 'note', 'project scaffolded');
EOF

# --- node deps for the fleet ------------------------------------------------
npm init -y >/dev/null
npm pkg set type=module >/dev/null
npm install grammy @anthropic-ai/sdk better-sqlite3 dotenv >/dev/null

echo ""
echo "== Scaffold complete =="
echo "  $ROOT/            .env, RULES.md, routing.json, logbook.db"
echo "  $ROOT/<agent>/    one workspace per agent (foreman radar quill wrench ledger)"
echo "  $ROOT/board/      the Pit Board lives here"
echo ""
echo "Next: open the tutorial and paste the prompts into your coding agent, starting"
echo "at Prompt 1. The project structure they expect is already in place."
echo "Tutorial: https://agent-garage.higgsfield.app/tutorials/pit-crew-mission-control"
`,
  'telegram-ops-bot': String.raw`#!/usr/bin/env bash
# Agent Garage auto-installer — Telegram Ops Bot
# https://agent-garage.higgsfield.app/tutorials/telegram-ops-bot
# Run on a fresh Debian/Ubuntu box as a sudo-capable user.
set -euo pipefail

echo "== Agent Garage — Telegram Ops Bot installer =="

command -v node >/dev/null 2>&1 || {
  echo "Node.js not found. Installing Node 20 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
}

read -rp "Telegram bot token (from @BotFather): " BOT_TOKEN
read -rp "Your numeric Telegram user id (from @userinfobot): " OWNER_ID
[ -n "$BOT_TOKEN" ] && [ -n "$OWNER_ID" ] || { echo "Both values are required."; exit 1; }

sudo mkdir -p /opt/ops-bot
sudo chown "$USER" /opt/ops-bot
cd /opt/ops-bot

npm init -y >/dev/null
npm install grammy systeminformation dotenv >/dev/null

cat > .env <<EOF
BOT_TOKEN=$BOT_TOKEN
OWNER_ID=$OWNER_ID
EOF
chmod 600 .env

cat > bot.js <<'EOF'
import { Bot, InlineKeyboard } from "grammy";
import si from "systeminformation";
import { execFile } from "node:child_process";
import "dotenv/config";

const bot = new Bot(process.env.BOT_TOKEN);
const OWNER = Number(process.env.OWNER_ID);
const SERVICES = ["nginx", "ops-bot", "postgresql"];

bot.use((ctx, next) => {
  if (ctx.from?.id !== OWNER) return;
  return next();
});

bot.command("ping", (ctx) => ctx.reply("on the bench"));

bot.command("status", async (ctx) => {
  const [cpu, mem, disk] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
  ]);
  const memUsed = ((1 - mem.available / mem.total) * 100).toFixed(0);
  const diskUsed = disk[0] ? disk[0].use.toFixed(0) : "?";
  await ctx.reply(
    "cpu " + cpu.currentLoad.toFixed(0) + "%\n" +
    "mem " + memUsed + "%\n" +
    "disk " + diskUsed + "%",
  );
});

bot.command("restart", async (ctx) => {
  const name = ctx.match?.trim();
  if (!SERVICES.includes(name)) {
    return ctx.reply("I can restart: " + SERVICES.join(", "));
  }
  const kb = new InlineKeyboard().text("Yes, restart " + name, "go:" + name);
  await ctx.reply("Restart " + name + "?", { reply_markup: kb });
});

bot.callbackQuery(/go:(.+)/, async (ctx) => {
  const name = ctx.match[1];
  if (!SERVICES.includes(name)) return ctx.answerCallbackQuery();
  execFile("sudo", ["systemctl", "restart", name], (err) => {
    ctx.reply(err ? "Failed: " + err.message : name + " restarted.");
  });
  await ctx.answerCallbackQuery();
});

bot.start();
EOF

node -e "require('fs').writeFileSync('package.json', JSON.stringify({ ...require('/opt/ops-bot/package.json'), type: 'module' }, null, 2))"

sudo tee /etc/systemd/system/ops-bot.service >/dev/null <<EOF
[Unit]
Description=Telegram ops bot
After=network.target

[Service]
ExecStart=$(command -v node) /opt/ops-bot/bot.js
Restart=always
User=$USER
EnvironmentFile=/opt/ops-bot/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now ops-bot

echo ""
echo "== Done. Send /ping to your bot on Telegram — it should answer 'on the bench'. =="
echo "Full tutorial: https://agent-garage.higgsfield.app/tutorials/telegram-ops-bot"
`,
}

export const Route = createFileRoute('/install/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const script = installers[params.slug]
        if (!script) return new Response('Not found', { status: 404 })
        return new Response(script, {
          headers: {
            'Content-Type': 'text/x-shellscript; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
          },
        })
      },
    },
  },
})
