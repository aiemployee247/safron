// Pit Crew — the fleet. One Telegram bot, five agents routed by topic thread.
// A message in the Wrench topic is answered by Wrench; General goes to Foreman.
// Owner-locked: only your Telegram user id is served. Every turn is logged,
// including token usage and an estimated cost the Mission Control dashboard reads.
import { Bot } from "grammy";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";

import { AGENTS } from "./agents.js";
import { append } from "./logbook.js";

const here = dirname(fileURLToPath(import.meta.url));
const routing = JSON.parse(readFileSync(join(here, "routing.json"), "utf8"));

// Reverse the {agent: threadId} map into {threadId: agent} for fast lookup.
const threadToAgent = new Map(
  Object.entries(routing.threads)
    .filter(([, id]) => Number(id) > 0)
    .map(([agent, id]) => [Number(id), agent]),
);

const OWNER = Number(process.env.OWNER_ID);
const bot = new Bot(process.env.BOT_TOKEN);
const anthropic = new Anthropic();
const MODEL = process.env.PIT_CREW_MODEL || "claude-sonnet-5";

// Rough per-million-token USD prices for the cost estimate on the dashboard.
// Override with PRICE_IN / PRICE_OUT env vars if your model differs.
const PRICE_IN = Number(process.env.PRICE_IN || 3) / 1_000_000;
const PRICE_OUT = Number(process.env.PRICE_OUT || 15) / 1_000_000;

// Owner lock: silently ignore anyone who isn't you.
bot.use((ctx, next) => {
  if (ctx.from?.id !== OWNER) return;
  return next();
});

function agentForThread(threadId) {
  if (threadId && threadToAgent.has(threadId)) return threadToAgent.get(threadId);
  return "foreman"; // General / unmapped topics go to the Foreman.
}

bot.on("message:text", async (ctx) => {
  const threadId = ctx.message.message_thread_id;
  const key = agentForThread(threadId);
  const agent = AGENTS[key];
  const text = ctx.message.text;

  append(key, "started", text.slice(0, 120));
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: agent.system,
      messages: [{ role: "user", content: text }],
    });
    const reply =
      res.content.find((b) => b.type === "text")?.text ?? "(no response)";

    // Telegram caps messages near 4096 chars; split long replies.
    for (let i = 0; i < reply.length; i += 4000) {
      await ctx.reply(reply.slice(i, i + 4000), {
        message_thread_id: threadId,
      });
    }

    // Record token usage + estimated cost so the System Monitor can chart it.
    const inTok = res.usage?.input_tokens ?? 0;
    const outTok = res.usage?.output_tokens ?? 0;
    const cost = inTok * PRICE_IN + outTok * PRICE_OUT;
    append(
      key,
      "finished",
      text.slice(0, 120),
      JSON.stringify({ in: inTok, out: outTok, cost: Number(cost.toFixed(6)), model: MODEL }),
    );
  } catch (err) {
    append(key, "error", err.message?.slice(0, 200) ?? "unknown error");
    await ctx.reply(`${agent.name} hit an error: ${err.message}`, {
      message_thread_id: threadId,
    });
  }
});

bot.catch((err) => append("fleet", "error", err.message?.slice(0, 200) ?? "bot error"));

// Retry the poller instead of crashing, so a transient Telegram conflict
// (e.g. a lingering poll after a restart) self-heals without a service loop.
async function runFleet() {
  for (let attempt = 1; ; attempt++) {
    try {
      await bot.start({
        drop_pending_updates: true,
        onStart: () => {
          append("fleet", "note", "fleet online");
          console.log("Pit Crew fleet running. Routing:", [...threadToAgent.entries()]);
        },
      });
      return; // clean shutdown
    } catch (err) {
      const desc = err?.description || err?.message || "poll error";
      if (attempt === 1) append("fleet", "error", String(desc).slice(0, 200));
      console.error(`fleet poll error (attempt ${attempt}), retrying in 20s:`, desc);
      await new Promise((r) => setTimeout(r, 20_000));
    }
  }
}

runFleet();
