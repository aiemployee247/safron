import { createFileRoute } from '@tanstack/react-router'

// One-line auto-installer scripts, keyed by tutorial slug. The script URL is
// only revealed to members on the /install page, but the script itself must be
// publicly curl-able (a fresh VPS has no session cookie).
const installers: Record<string, string> = {
  'agent-garage': String.raw`#!/usr/bin/env bash
# Agent Garage — self-host installer (runs the exact site build on your VPS via
# Miniflare/workerd, with a local SQLite-backed D1). Run on Debian/Ubuntu.
set -euo pipefail

BASE="https://agent-garage.higgsfield.app"
ROOT=/opt/agent-garage

echo "== Agent Garage self-host installer =="
command -v node >/dev/null 2>&1 || {
  echo "Installing Node 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
}
sudo apt-get install -y tar >/dev/null 2>&1 || true

sudo mkdir -p "$ROOT"
sudo chown -R "$USER" "$ROOT"
cd "$ROOT"

echo "Downloading site bundle (~12MB)..."
curl -fsSL "$BASE/selfhost/agent-garage-selfhost.tar.gz" -o bundle.tar.gz
tar -xzf bundle.tar.gz && rm -f bundle.tar.gz

echo "Installing runtime (Miniflare + workerd, ~1 min)..."
npm install --omit=dev >/dev/null 2>&1

# Base config. Secrets (Stripe/Google/Resend) get added in a later step; the
# site renders fully without them (those features stay dormant until set).
if [ ! -f .env ]; then
  cat > .env <<EOF
PORT=8090
PUBLIC_ORIGIN=https://agent.qepilot.com
D1_PERSIST=$ROOT/data/d1
EOF
fi
chmod 600 .env

NODE_BIN="$(command -v node)"
sudo tee /etc/systemd/system/agent-garage.service >/dev/null <<EOF
[Unit]
Description=Agent Garage (self-hosted via Miniflare)
After=network.target
[Service]
WorkingDirectory=$ROOT
ExecStart=$NODE_BIN $ROOT/serve.mjs
Restart=always
RestartSec=5
User=$USER
EnvironmentFile=$ROOT/.env
[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now agent-garage
sleep 5

echo ""
echo "== Done =="
systemctl is-active agent-garage
curl -s -o /dev/null -w "local check (want 200): %{http_code}\n" http://127.0.0.1:8090/ || true
echo "The site is serving on 127.0.0.1:8090. Next: the agent.qepilot.com Traefik route + cert."
`,
  'pit-crew-mission-control': String.raw`#!/usr/bin/env bash
# Agent Garage auto-installer — Pit Crew (5-agent Telegram fleet + Pit Board)
# https://agent-garage.higgsfield.app/tutorials/pit-crew-mission-control
# Installs a REAL, runnable fleet: five topic-routed agents on Telegram plus a
# live read-only Pit Board dashboard. Run on a fresh Debian/Ubuntu box as a
# sudo-capable user.
set -euo pipefail

BASE="https://agent-garage.higgsfield.app/pit-crew-starter"
ROOT=/opt/pit-crew

echo "== Agent Garage — Pit Crew installer =="
echo "Installs a working 5-agent Telegram fleet + live Pit Board dashboard."
echo ""

# --- dependencies -----------------------------------------------------------
command -v node >/dev/null 2>&1 || {
  echo "Node.js not found. Installing Node 20 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
}
sudo apt-get install -y build-essential python3 >/dev/null 2>&1 || true  # native build deps for better-sqlite3

# --- config -----------------------------------------------------------------
read -rp "Telegram bot token (from @BotFather): " BOT_TOKEN < /dev/tty
read -rp "Your numeric Telegram user id (from @userinfobot): " OWNER_ID < /dev/tty
read -rp "Anthropic API key (sk-ant-...): " ANTHROPIC_API_KEY < /dev/tty
[ -n "$BOT_TOKEN" ] && [ -n "$OWNER_ID" ] && [ -n "$ANTHROPIC_API_KEY" ] || {
  echo "All three values are required."; exit 1;
}

sudo mkdir -p "$ROOT/board"
sudo chown -R "$USER" "$ROOT"
cd "$ROOT"

# --- fetch the real fleet files --------------------------------------------
# Left of the colon is the file on the site; right is where it lands locally.
echo "Fetching fleet files..."
for pair in \
  "package.json:package.json" \
  "agents.js:agents.js" \
  "logbook.js:logbook.js" \
  "fleet.js:fleet.js" \
  "routing.example.json:routing.example.json" \
  "board-server.js:board/server.js" \
  "board-index.html.txt:board/index.html"; do
  remote="$(echo "$pair" | cut -d: -f1)"
  dest="$(echo "$pair" | cut -d: -f2)"
  curl -fsSL "$BASE/$remote" -o "$ROOT/$dest"
done
cp -n routing.example.json routing.json

cat > .env <<EOF
BOT_TOKEN=$BOT_TOKEN
OWNER_ID=$OWNER_ID
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
EOF
chmod 600 .env

# --- install deps (builds better-sqlite3) -----------------------------------
echo "Installing dependencies (this compiles better-sqlite3, ~30s)..."
npm install >/dev/null

# --- run fleet + board as services ------------------------------------------
NODE_BIN="$(command -v node)"

sudo tee /etc/systemd/system/pit-crew-fleet.service >/dev/null <<EOF
[Unit]
Description=Pit Crew fleet
After=network.target
[Service]
WorkingDirectory=$ROOT
ExecStart=$NODE_BIN $ROOT/fleet.js
Restart=always
User=$USER
EnvironmentFile=$ROOT/.env
[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/pit-crew-board.service >/dev/null <<EOF
[Unit]
Description=Pit Crew Pit Board (read-only dashboard)
After=network.target
[Service]
WorkingDirectory=$ROOT
ExecStart=$NODE_BIN $ROOT/board/server.js
Restart=always
User=$USER
Environment=BOARD_PORT=8787
[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now pit-crew-board
# The fleet needs routing.json filled in before it's useful; enable but don't
# fail the install if it restarts waiting for thread ids.
sudo systemctl enable --now pit-crew-fleet || true

echo ""
echo "== Pit Crew installed =="
echo "  Pit Board:  http://127.0.0.1:8787   (read-only; expose privately via Tailscale)"
echo "  Fleet:      systemctl status pit-crew-fleet"
echo ""
echo "The Foreman answers now. To route the specialists to their own Telegram"
echo "topics, fill $ROOT/routing.json with your topic thread ids (tutorial Prompt 7-8),"
echo "then: sudo systemctl restart pit-crew-fleet"
echo ""
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

read -rp "Telegram bot token (from @BotFather): " BOT_TOKEN < /dev/tty
read -rp "Your numeric Telegram user id (from @userinfobot): " OWNER_ID < /dev/tty
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
