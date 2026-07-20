// Tutorial catalog metadata (client-safe). The actual lesson content lives in
// tutorials-content.server.ts and is served through a server function that
// enforces the membership gate.

export type TutorialBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "code"; lang: string; label: string; code: string }
  | { kind: "note"; text: string };

export type Tutorial = {
  slug: string;
  title: string;
  deck: string;
  track: "AI Agents" | "Automation" | "Self-hosting";
  minutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  gated: boolean;
  cover: string;
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
    title: "Telegram Ops Bot",
    deck: "A bot that watches your server, answers questions about it in plain language, and restarts things when you tell it to.",
    track: "Automation",
    minutes: 60,
    level: "Intermediate",
    gated: false,
    cover: "/assets/tutorial-telegram.png",
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
