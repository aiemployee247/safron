// Tutorial catalog metadata (client-safe). The actual lesson content lives in
// tutorials-content.server.ts and is served through a server function that
// enforces the membership gate.

export type TutorialBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "code"; lang: string; label: string; code: string }
  | { kind: "note"; text: string }
  // Section divider: "PART 0X / 0Y — TITLE" with a one-line blurb.
  | { kind: "part"; num: number; total: number; title: string; blurb: string }
  // Copy-paste prompt card: paste into Claude Code / your agent verbatim.
  | { kind: "prompt"; num: string; title: string; text: string }
  | { kind: "image"; src: string; caption: string }
  | { kind: "video"; youtubeId: string };

export type TutorialContents = { part: string; steps: string[] };

export type Tutorial = {
  slug: string;
  title: string;
  deck: string;
  track: "AI Agents" | "Automation" | "Self-hosting";
  minutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  gated: boolean;
  cover: string;
  /* Flagship-format extras (all optional; plain tutorials skip them). */
  date?: string;
  builders?: string;
  videoId?: string;
  prereqs?: string[];
  contents?: TutorialContents[];
  /* True only for builds that ship a one-line auto-installer script. */
  installer?: boolean;
  /* True for builds whose downloadable bundle includes the dashboard .html template. */
  dashboardTemplate?: boolean;
};

export const tutorials: Tutorial[] = [
  {
    slug: "control-room-discord",
    title: "Build a Control Room — 6-Agent AI Crew on Discord with a Live Mission Control Dashboard",
    deck: "A Director on Telegram coordinating five specialists — Scout, Scribe, Rig, Tally, and Relay — each bound to its own Discord channel, all rendered live on a four-tab Mission Control dashboard with token-cost tracking. 16 copy-paste prompts.",
    track: "AI Agents",
    minutes: 180,
    level: "Advanced",
    gated: true,
    cover: "/assets/tutorial-inbox.png",
    date: "Jul 2026",
    builders: "3.4k",
    dashboardTemplate: true,
    prereqs: [
      "The OpenClaw agent framework installed on your VPS (the crew runs on it)",
      "Node 20 or newer on the box",
      "An Anthropic API key for the crew's model calls",
      "A Discord server where you have admin rights, plus a bot token",
      "A Telegram account for the Director agent",
      "Basic comfort with SSH and the command line",
      "About 2–3 hours of focused setup time",
    ],
    contents: [
      {
        part: "Part 01 / 05 — Foundation — the Director & the house rules",
        steps: [
          "Give the Director its identity",
          "Let the Director interview you",
          "Install the house rules",
        ],
      },
      {
        part: "Part 02 / 05 — The crew — five specialists",
        steps: [
          "Hire Scout, Scribe, Rig, Tally & Relay",
          "Isolated workspaces & role boundaries",
          "Shared crew awareness",
        ],
      },
      {
        part: "Part 03 / 05 — Discord — server, channels & bindings",
        steps: [
          "Wire the crew to your Discord server",
          "Create the channels & category groups",
          "Bind each agent to its channel, then verify",
        ],
      },
      {
        part: "Part 04 / 05 — The logbook — logging & token-cost capture",
        steps: [
          "Create the shared logbook",
          "Teach every agent to log its turns",
          "Capture token usage & cost per call",
        ],
      },
      {
        part: "Part 05 / 05 — Mission Control — the four-tab dashboard",
        steps: [
          "Build the read-only data layer",
          "Wire the four tabs live",
          "Secure remote access",
          "Troubleshooting prompts",
        ],
      },
    ],
  },
  {
    slug: "pit-crew-mission-control",
    title: "Build a Pit Crew — 5-Agent AI Fleet on Telegram with a Live Pit Board Dashboard",
    deck: "A Foreman agent coordinating four specialists — Radar, Quill, Wrench, and Ledger — each in its own Telegram channel, with a live read-only Pit Board dashboard on your VPS. 14 copy-paste prompts.",
    track: "AI Agents",
    minutes: 150,
    level: "Advanced",
    gated: true,
    cover: "/assets/tutorial-telegram.png",
    date: "Jul 2026",
    builders: "2.1k",
    installer: true,
    dashboardTemplate: true,
    prereqs: [
      "A VPS with Claude Code (or another capable coding agent) installed",
      "Node 20 or newer on the box",
      "An Anthropic API key for the fleet's model calls",
      "A Telegram account and a bot token from @BotFather",
      "Basic comfort with SSH and the command line",
      "About 2–3 hours of focused setup time",
    ],
    contents: [
      {
        part: "Part 01 / 06 — Foundation — the Foreman & the shop rules",
        steps: [
          "Give the Foreman its identity",
          "Let the Foreman interview you",
          "Install the shop rules",
        ],
      },
      {
        part: "Part 02 / 06 — The specialist crew",
        steps: [
          "Hire Radar, Quill, Wrench & Ledger",
          "Isolated workspaces & role boundaries",
          "Shared crew awareness",
        ],
      },
      {
        part: "Part 03 / 06 — Telegram routing — one channel per agent",
        steps: [
          "Create the group & topic threads",
          "Build the router",
          "Verify every channel answers as itself",
        ],
      },
      {
        part: "Part 04 / 06 — The logbook — activity logging & memory",
        steps: ["Create the shared logbook", "Nightly log rotation"],
      },
      {
        part: "Part 05 / 06 — The Pit Board — live dashboard",
        steps: [
          "Build the read-only data layer",
          "Build the Pit Board page",
          "Wire live updates",
        ],
      },
      {
        part: "Part 06 / 06 — Troubleshooting prompts",
        steps: ["Every channel answers as the Foreman", "The Pit Board shows stale data"],
      },
    ],
  },
  {
    slug: "hermes-agent-setup",
    title: "Set Up Hermes Agent — An Open-Source, Self-Improving AI Agent on Your Own Server",
    deck: "Install NousResearch's open-source Hermes Agent, connect it to Telegram or Discord, and get its local API gateway running — a solid base other builds (like our Pit Crew tutorial) can sit on top of.",
    track: "Self-hosting",
    minutes: 40,
    level: "Beginner",
    gated: false,
    cover: "/assets/tutorial-homelab.png",
    date: "Jul 2026",
    builders: "890",
    installer: true,
    prereqs: [
      "A Linux or macOS machine — a VPS, a homelab box, or your own laptop",
      "About 2GB of free disk space and a stable connection",
      "An API key for whichever model you'll point Hermes at",
      "A Telegram or Discord account, if you want to chat with it remotely",
      "About 20–40 minutes, most of it unattended install time",
    ],
    contents: [
      {
        part: "Part 01 / 03 — What it is, and installing it",
        steps: [
          "What Hermes Agent actually does",
          "Run the official installer",
          "Confirm the install landed",
        ],
      },
      {
        part: "Part 02 / 03 — First run — the wizard & a chat platform",
        steps: [
          "Walk through the setup wizard",
          "Connect Telegram or Discord",
          "Send it a real task",
        ],
      },
      {
        part: "Part 03 / 03 — The gateway, safety, and what's next",
        steps: [
          "Verify the local API gateway",
          "Know what it can touch before you expand it",
          "Troubleshooting prompts",
        ],
      },
    ],
  },
  {
    slug: "inbox-zero-agent",
    title: "Inbox Zero Agent",
    deck: "An agent that reads your inbox, sorts what matters, and drafts replies you approve with one click.",
    track: "AI Agents",
    minutes: 45,
    level: "Beginner",
    gated: false,
    cover: "/assets/tutorial-inbox.png",
  },
  {
    slug: "telegram-ops-bot",
    title: "Build a Telegram Ops Bot — Server Health, Safe Restarts & Alerts from Your Pocket",
    deck: "A bot that watches your server, answers questions about it in plain language, and restarts things when you tell it to. 7 copy-paste prompts.",
    track: "Automation",
    minutes: 60,
    level: "Intermediate",
    gated: false,
    cover: "/assets/tutorial-telegram.png",
    date: "Jul 2026",
    builders: "1.4k",
    installer: true,
    prereqs: [
      "Any Linux server you can SSH into — a $5 VPS is fine",
      "Node 20 or newer installed on the server",
      "A Telegram account",
      "Claude Code (or another coding agent) on the server",
      "About an hour of focused setup time",
    ],
    contents: [
      {
        part: "Part 01 / 03 — Foundation — the bot & its owner lock",
        steps: [
          "Create the bot with BotFather",
          "Scaffold the project",
          "Lock the bot to your user id",
        ],
      },
      {
        part: "Part 02 / 03 — Health reports & safe restarts",
        steps: [
          "The /status health report",
          "Whitelist the services it may touch",
          "Confirm-to-restart with one tap",
        ],
      },
      {
        part: "Part 03 / 03 — Run forever + troubleshooting",
        steps: ["Install it as a systemd service", "Troubleshooting prompts"],
      },
    ],
  },
  {
    slug: "homelab-llm",
    title: "Homelab LLM",
    deck: "Run an open model on a mini PC and point your tools at it. Private, fast enough, and yours.",
    track: "Self-hosting",
    minutes: 50,
    level: "Intermediate",
    gated: true,
    cover: "/assets/tutorial-homelab.png",
  },
  {
    slug: "desk-mic-assistant",
    title: "Desk Mic Assistant",
    deck: "A push-to-talk voice assistant on a Raspberry Pi that answers from your notes, not the internet.",
    track: "AI Agents",
    minutes: 90,
    level: "Advanced",
    gated: true,
    cover: "/assets/tutorial-voice.png",
  },
];

export function getTutorial(slug: string): Tutorial | undefined {
  return tutorials.find((t) => t.slug === slug);
}
