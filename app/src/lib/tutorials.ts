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
};

export const tutorials: Tutorial[] = [
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
