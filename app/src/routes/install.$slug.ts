import { createFileRoute } from '@tanstack/react-router'

// One-line auto-installer scripts, keyed by tutorial slug. The script URL is
// only revealed to members on the /install page, but the script itself must be
// publicly curl-able (a fresh VPS has no session cookie).
const installers: Record<string, string> = {
  'agent-garage': String.raw`#!/usr/bin/env bash
# Agent Garage — self-host installer (runs the exact site build on your VPS via
# Miniflare/workerd, with a local SQLite-backed D1). Run on Debian/Ubuntu.
set -euo pipefail

BASE="https://agent.qepilot.com"
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
# https://agent.qepilot.com/tutorials/pit-crew-mission-control
# Installs a REAL, runnable fleet: five topic-routed agents on Telegram plus a
# live read-only Pit Board dashboard. Run on a fresh Debian/Ubuntu box as a
# sudo-capable user.
set -euo pipefail

BASE="https://agent.qepilot.com/pit-crew-starter"
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
echo "Tutorial: https://agent.qepilot.com/tutorials/pit-crew-mission-control"
`,
  'pit-crew-mission-control-mac': String.raw`#!/usr/bin/env bash
# Agent Garage auto-installer — Pit Crew, macOS local edition
# https://agent.qepilot.com/tutorials/pit-crew-mission-control
# Installs the same 5-agent Telegram fleet + Pit Board dashboard as the VPS
# installer, but locally on your Mac via launchd (no sudo, no systemd).
# Safe to re-run: it detects an existing install and asks before touching it.
set -euo pipefail

BASE="https://agent.qepilot.com/pit-crew-starter"
ROOT="$HOME/pit-crew"
PLIST_DIR="$HOME/Library/LaunchAgents"
LABEL_FLEET="com.agentgarage.pitcrew.fleet"
LABEL_BOARD="com.agentgarage.pitcrew.board"

if [ -t 1 ]; then B=$'\033[1m'; DIM=$'\033[2m'; G=$'\033[32m'; R=$'\033[31m'; ACC=$'\033[33m'; Z=$'\033[0m'
else B=""; DIM=""; G=""; R=""; ACC=""; Z=""; fi
step() { printf '\n%s%s==> %s%s\n' "$B" "$ACC" "$*" "$Z"; }
ok()   { printf '  %s✓%s %s\n' "$G" "$Z" "$*"; }
warn() { printf '  %s!%s %s\n' "$ACC" "$Z" "$*"; }
err()  { printf '  %s✗%s %s\n' "$R" "$Z" "$*"; }

printf '\n%s%sAgent Garage — Pit Crew (macOS, local)%s\n' "$B" "$ACC" "$Z"
printf '%sInstalls a 5-agent Telegram fleet + live dashboard on this Mac.%s\n' "$DIM" "$Z"

# --- 1. must be a Mac --------------------------------------------------------
step "Checking your OS"
if [ "$(uname -s)" != "Darwin" ]; then
  err "This installer is for macOS only."
  printf '  Run the Linux/VPS installer instead:\n'
  printf '  %scurl -fsSL https://agent.qepilot.com/install/pit-crew-mission-control | bash%s\n' "$DIM" "$Z"
  exit 1
fi
ok "macOS detected ($(sw_vers -productVersion 2>/dev/null || echo unknown))"

# --- 2. detect an existing install, ask before touching anything ------------
step "Checking for an existing install"
EXISTING=0
[ -d "$ROOT" ] && EXISTING=1
if command -v launchctl >/dev/null 2>&1; then
  launchctl list 2>/dev/null | grep -q "$LABEL_FLEET" && EXISTING=1
  launchctl list 2>/dev/null | grep -q "$LABEL_BOARD" && EXISTING=1
fi

if [ "$EXISTING" = "1" ]; then
  warn "Found an existing Pit Crew install at $ROOT."
  if [ -d "$ROOT" ]; then
    printf '    %s\n' "$DIM$(du -sh "$ROOT" 2>/dev/null | awk '{print $1}') on disk, including its activity log, kanban board, and notes.$Z"
  fi
  printf '\n  %sThis will stop the running services and delete %s, then reinstall fresh.%s\n' "$B" "$ROOT" "$Z"
  read -r -p "  Continue? [y/N] " REPLY </dev/tty || REPLY=""
  case "$REPLY" in
    y|Y|yes|YES) : ;;
    *) printf '\n  No changes made. Exiting.\n\n'; exit 0 ;;
  esac
  step "Removing the existing install"
  launchctl unload "$PLIST_DIR/$LABEL_FLEET.plist" 2>/dev/null || true
  launchctl unload "$PLIST_DIR/$LABEL_BOARD.plist" 2>/dev/null || true
  rm -f "$PLIST_DIR/$LABEL_FLEET.plist" "$PLIST_DIR/$LABEL_BOARD.plist"
  rm -rf "$ROOT"
  ok "Removed."
else
  ok "No existing install found — clean start."
fi

# --- 3. prerequisites — confirm before changing anything on the system ------
step "Checking prerequisites"

if ! xcode-select -p >/dev/null 2>&1; then
  err "Xcode Command Line Tools are required (needed to build the local database)."
  printf '  Run this yourself, click through the installer, then re-run this script:\n'
  printf '  %sxcode-select --install%s\n' "$DIM" "$Z"
  exit 1
fi
ok "Xcode Command Line Tools present"

if ! command -v node >/dev/null 2>&1 || [ "$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')" -lt 20 ]; then
  warn "Node.js 20+ not found."
  if command -v brew >/dev/null 2>&1; then
    read -r -p "  Install Node.js now via Homebrew? [Y/n] " REPLY </dev/tty || REPLY="y"
    case "$REPLY" in
      n|N|no|NO)
        err "Node.js is required. Install it, then re-run this script."; exit 1 ;;
      *)
        brew install node@20 >/dev/null 2>&1 || brew install node
        brew link --overwrite --force node@20 >/dev/null 2>&1 || true
        ;;
    esac
  else
    err "Homebrew isn't installed either. Install Node.js 20+ from https://nodejs.org,"
    printf '  then re-run this script.\n'
    exit 1
  fi
fi
ok "Node $(node -v)"

# --- 4. the three secrets, explained one at a time ---------------------------
step "Fleet credentials"
printf '  Three values, entered once and stored only in %s/.env (chmod 600).\n\n' "$ROOT"
read -r -p "  Telegram bot token (from @BotFather): " BOT_TOKEN </dev/tty
read -r -p "  Your numeric Telegram user id (from @userinfobot): " OWNER_ID </dev/tty
read -r -p "  Anthropic API key (sk-ant-...): " ANTHROPIC_API_KEY </dev/tty
[ -n "$BOT_TOKEN" ] && [ -n "$OWNER_ID" ] && [ -n "$ANTHROPIC_API_KEY" ] || {
  err "All three values are required."; exit 1;
}

# --- 5. fetch the fleet + dashboard, install deps ----------------------------
step "Fetching the fleet"
mkdir -p "$ROOT/board" "$ROOT/logs"
cd "$ROOT"
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
ok "Fleet files in place"

step "Installing dependencies (compiles the local database, ~30-60s)"
npm install >/dev/null
ok "Dependencies installed"

# --- 6. launchd services, the Mac equivalent of systemd ----------------------
step "Setting up background services (launchd)"
mkdir -p "$PLIST_DIR"
NODE_BIN="$(command -v node)"

cat > "$PLIST_DIR/$LABEL_FLEET.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL_FLEET</string>
  <key>ProgramArguments</key><array><string>$NODE_BIN</string><string>$ROOT/fleet.js</string></array>
  <key>WorkingDirectory</key><string>$ROOT</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$ROOT/logs/fleet.log</string>
  <key>StandardErrorPath</key><string>$ROOT/logs/fleet.err.log</string>
</dict></plist>
EOF

cat > "$PLIST_DIR/$LABEL_BOARD.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL_BOARD</string>
  <key>ProgramArguments</key><array><string>$NODE_BIN</string><string>$ROOT/board/server.js</string></array>
  <key>WorkingDirectory</key><string>$ROOT</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$ROOT/logs/board.log</string>
  <key>StandardErrorPath</key><string>$ROOT/logs/board.err.log</string>
</dict></plist>
EOF

launchctl unload "$PLIST_DIR/$LABEL_FLEET.plist" 2>/dev/null || true
launchctl unload "$PLIST_DIR/$LABEL_BOARD.plist" 2>/dev/null || true
launchctl load -w "$PLIST_DIR/$LABEL_FLEET.plist"
launchctl load -w "$PLIST_DIR/$LABEL_BOARD.plist"
sleep 3
ok "Fleet + dashboard running"

# --- 7. hand off to the human -------------------------------------------------
step "Done"
curl -s -o /dev/null -w "  local check (want 200): %{http_code}\n" http://127.0.0.1:8787/ || true
printf '\n  %sOpen the dashboard:%s   open http://127.0.0.1:8787\n' "$B" "$Z"
printf '  %sTest the fleet:%s       message your bot on Telegram — the Foreman answers now.\n' "$B" "$Z"
printf '\n  To route the four specialists to their own Telegram topics, fill\n'
printf '  %s/routing.json with your topic thread ids (tutorial Prompt 7-8), then:\n' "$ROOT"
printf '    launchctl unload %s/%s.plist && launchctl load -w %s/%s.plist\n' "$PLIST_DIR" "$LABEL_FLEET" "$PLIST_DIR" "$LABEL_FLEET"
printf '\n  Logs:  tail -f %s/logs/fleet.log\n' "$ROOT"
printf '  Stop:  launchctl unload %s/%s.plist %s/%s.plist\n' "$PLIST_DIR" "$LABEL_FLEET" "$PLIST_DIR" "$LABEL_BOARD"
printf '\n  Tutorial: https://agent.qepilot.com/tutorials/pit-crew-mission-control\n\n'
`,
  'hermes-agent-setup': String.raw`#!/usr/bin/env bash
# Agent Garage — Hermes Agent setup
# https://agent.qepilot.com/tutorials/hermes-agent-setup
# Hermes Agent is an open-source project by NousResearch (github.com/NousResearch/hermes-agent),
# not by Agent Garage. This is a thin, honest hand-off — not a fork or a rehost — to
# their official installer. Run it directly yourself if you'd rather skip the middleman:
#   curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
set -euo pipefail

echo ""
echo "== Agent Garage -> Hermes Agent setup =="
echo "Hermes Agent is an open-source project by NousResearch, not by Agent Garage."
echo "This installs Python 3.11 (via uv), Node 22, and clones their repo to ~/.hermes."
echo ""
read -r -p "Continue and hand off to NousResearch's official installer? [Y/n] " REPLY </dev/tty || REPLY="y"
case "$REPLY" in
  n|N|no|NO) echo "Cancelled. No changes made."; exit 0 ;;
esac

curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

echo ""
echo "Done. Run 'hermes' to launch the setup wizard (model, API key, Telegram/Discord)."
echo "Tutorial: https://agent.qepilot.com/tutorials/hermes-agent-setup"
`,
  'hermes-agent-setup-mac': String.raw`#!/usr/bin/env bash
# Agent Garage -> Hermes Agent setup, macOS local edition
# https://agent.qepilot.com/tutorials/hermes-agent-setup
# Hermes Agent is an open-source project by NousResearch, not by Agent Garage.
# Their own installer is already cross-platform and already handles re-runs
# safely (it updates an existing ~/.hermes in place, stashing local changes).
# What this wrapper adds: checking for an existing install FIRST and letting
# you choose update-in-place vs a full wipe, before anything runs.
set -euo pipefail

HERMES_HOME="$HOME/.hermes"

if [ -t 1 ]; then B=$'\033[1m'; DIM=$'\033[2m'; G=$'\033[32m'; R=$'\033[31m'; ACC=$'\033[33m'; Z=$'\033[0m'
else B=""; DIM=""; G=""; R=""; ACC=""; Z=""; fi
step() { printf '\n%s%s==> %s%s\n' "$B" "$ACC" "$*" "$Z"; }
ok()   { printf '  %s✓%s %s\n' "$G" "$Z" "$*"; }
warn() { printf '  %s!%s %s\n' "$ACC" "$Z" "$*"; }
err()  { printf '  %s✗%s %s\n' "$R" "$Z" "$*"; }

printf '\n%s%sAgent Garage -> Hermes Agent setup (macOS)%s\n' "$B" "$ACC" "$Z"
printf '%sHermes Agent is an open-source project by NousResearch, not by Agent Garage.%s\n' "$DIM" "$Z"

step "Checking your OS"
if [ "$(uname -s)" != "Darwin" ]; then
  err "This installer is for macOS only."
  printf '  Run the general installer instead (their script self-detects Linux):\n'
  printf '  %scurl -fsSL https://agent.qepilot.com/install/hermes-agent-setup | bash%s\n' "$DIM" "$Z"
  exit 1
fi
ok "macOS detected ($(sw_vers -productVersion 2>/dev/null || echo unknown))"

step "Checking for an existing install"
FOUND=0
command -v hermes >/dev/null 2>&1 && FOUND=1
[ -d "$HERMES_HOME" ] && FOUND=1

MODE="fresh"
if [ "$FOUND" = "1" ]; then
  warn "Found an existing Hermes Agent install."
  if command -v hermes >/dev/null 2>&1; then
    printf '    %s\n' "$(hermes --version 2>&1 | head -1)"
  fi
  [ -d "$HERMES_HOME" ] && printf '    %s at %s\n' "$(du -sh "$HERMES_HOME" 2>/dev/null | awk '{print $1}') on disk" "$HERMES_HOME"
  printf '\n  %sU%s  Update in place — safe, keeps your local changes (recommended)\n' "$B" "$Z"
  printf '  %sR%s  Wipe %s and reinstall from scratch\n' "$B" "$Z" "$HERMES_HOME"
  printf '  %sN%s  Cancel, no changes\n' "$B" "$Z"
  read -r -p "  Choice [U/r/N]: " REPLY </dev/tty || REPLY=""
  case "$REPLY" in
    r|R)
      read -r -p "  This permanently deletes $HERMES_HOME. Continue? [y/N] " CONFIRM </dev/tty || CONFIRM=""
      case "$CONFIRM" in
        y|Y|yes|YES)
          rm -rf "$HERMES_HOME"
          ok "Removed. Starting fresh."
          MODE="fresh"
          ;;
        *) printf '\n  Cancelled. No changes made.\n\n'; exit 0 ;;
      esac
      ;;
    u|U|"")
      ok "Updating in place — their installer handles this safely."
      MODE="update"
      ;;
    *) printf '\n  Cancelled. No changes made.\n\n'; exit 0 ;;
  esac
else
  ok "No existing install found — clean start."
fi

step "Handing off to NousResearch's official installer"
printf '  This installs Python 3.11 (via uv), Node 22, and %s ~/.hermes.\n' "$([ "$MODE" = update ] && echo 'updates' || echo 'clones')"
read -r -p "  Continue? [Y/n] " GO </dev/tty || GO="y"
case "$GO" in
  n|N|no|NO) printf '\n  Cancelled. No changes made.\n\n'; exit 0 ;;
esac

curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

step "Done"
printf "  Run %s'hermes'%s to launch the setup wizard (model, API key, Telegram/Discord).\n" "$B" "$Z"
printf '  Tutorial: https://agent.qepilot.com/tutorials/hermes-agent-setup\n\n'
`,
  'telegram-ops-bot': String.raw`#!/usr/bin/env bash
# Agent Garage auto-installer — Telegram Ops Bot
# https://agent.qepilot.com/tutorials/telegram-ops-bot
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
echo "Full tutorial: https://agent.qepilot.com/tutorials/telegram-ops-bot"
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
