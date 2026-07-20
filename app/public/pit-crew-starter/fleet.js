// Pit Crew — the fleet. One Telegram bot, five agents routed by topic thread.
// A message in the Wrench topic is answered by Wrench; General goes to Foreman.
// Owner-locked: only your Telegram user id is served. Every turn is logged.
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
    append(key, "finished", text.slice(0, 120));
  } catch (err) {
    append(key, "error", err.message?.slice(0, 200) ?? "unknown error");
    await ctx.reply(`${agent.name} hit an error: ${err.message}`, {
      message_thread_id: threadId,
    });
  }
});

bot.catch((err) => append("fleet", "error", err.message?.slice(0, 200) ?? "bot error"));

append("fleet", "note", "fleet started");
bot.start();
console.log("Pit Crew fleet running. Routing:", [...threadToAgent.entries()]);
