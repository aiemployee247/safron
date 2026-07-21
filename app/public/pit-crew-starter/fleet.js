// Pit Crew — the fleet. One Telegram bot, five agents routed by topic thread.
// A message in the Wrench topic is answered by Wrench; General goes to Foreman.
// Owner-locked: only your Telegram user id is served. Every turn is logged,
// including token usage and an estimated cost the Mission Control dashboard reads.
//
// The Foreman is the one agent with real delegation: when it decides a task
// needs a specialist, it calls them directly (a real model turn each, logged
// under that specialist's own name) and folds their answers into one final
// reply — you never have to message Radar/Quill/Wrench/Ledger yourself.
// Delegation is one level deep only: specialists never get delegation tools,
// so there's no recursive chain and no runaway cost.
import { Bot } from "grammy";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";

import { AGENTS, AGENT_KEYS } from "./agents.js";
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

const SPECIALIST_KEYS = AGENT_KEYS.filter((k) => k !== "foreman");

// One delegation tool per specialist — Claude can call several in one turn
// if the task genuinely needs more than one of them.
const DELEGATE_TOOLS = SPECIALIST_KEYS.map((key) => ({
  name: "delegate_to_" + key,
  description:
    `Delegate a piece of the task to ${AGENTS[key].name}, the ${AGENTS[key].role} specialist. ` +
    `Only use this when the task genuinely needs ${AGENTS[key].name}'s expertise — don't delegate work you can answer yourself.`,
  input_schema: {
    type: "object",
    properties: {
      task: { type: "string", description: `A clear, self-contained task description for ${AGENTS[key].name}.` },
    },
    required: ["task"],
  },
}));

function costOf(usage) {
  const inTok = usage?.input_tokens ?? 0;
  const outTok = usage?.output_tokens ?? 0;
  return { inTok, outTok, cost: inTok * PRICE_IN + outTok * PRICE_OUT };
}
function logTurn(key, summary, usage) {
  const { inTok, outTok, cost } = costOf(usage);
  append(key, "finished", summary.slice(0, 120), JSON.stringify({ in: inTok, out: outTok, cost: Number(cost.toFixed(6)), model: MODEL }));
  return { inTok, outTok, cost };
}

// Owner lock: silently ignore anyone who isn't you.
bot.use((ctx, next) => {
  if (ctx.from?.id !== OWNER) return;
  return next();
});

function agentForThread(threadId) {
  if (threadId && threadToAgent.has(threadId)) return threadToAgent.get(threadId);
  return "foreman"; // General / unmapped topics go to the Foreman.
}

// Run one specialist turn (no delegation tools — this is where the chain stops).
async function runSpecialist(key, task) {
  append(key, "started", task.slice(0, 120));
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: AGENTS[key].system,
      messages: [{ role: "user", content: task }],
    });
    const text = res.content.find((b) => b.type === "text")?.text ?? "(no response)";
    const { cost } = logTurn(key, task, res.usage);
    return { key, ok: true, text, cost };
  } catch (err) {
    append(key, "error", err.message?.slice(0, 200) ?? "unknown error");
    return { key, ok: false, text: `${AGENTS[key].name} hit an error: ${err.message}`, cost: 0 };
  }
}

// The Foreman's turn: one call with delegation tools, then — if it delegated —
// a second call handing back every specialist's answer so it can synthesize
// a single final reply. Every real model call anywhere in this chain gets its
// own logged turn, under whichever agent actually ran it.
async function runForeman(threadId, text) {
  append("foreman", "started", text.slice(0, 120));
  let totalIn = 0, totalOut = 0, totalCost = 0;

  try {
    const first = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: AGENTS.foreman.system,
      tools: DELEGATE_TOOLS,
      messages: [{ role: "user", content: text }],
    });
    {
      const { inTok, outTok, cost } = costOf(first.usage);
      totalIn += inTok; totalOut += outTok; totalCost += cost;
    }

    const toolUses = first.content.filter((b) => b.type === "tool_use");
    if (toolUses.length === 0) {
      // No delegation needed — Foreman answered directly.
      const reply = first.content.find((b) => b.type === "text")?.text ?? "(no response)";
      append("foreman", "finished", text.slice(0, 120), JSON.stringify({ in: totalIn, out: totalOut, cost: Number(totalCost.toFixed(6)), model: MODEL }));
      return reply;
    }

    // Run every delegated specialist call (in parallel — they're independent).
    const results = await Promise.all(
      toolUses.map((t) => runSpecialist(t.name.replace("delegate_to_", ""), t.input.task)),
    );
    for (const r of results) totalCost += r.cost;

    // Hand the specialists' answers back to Foreman to fold into one reply.
    const second = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: AGENTS.foreman.system,
      messages: [
        { role: "user", content: text },
        { role: "assistant", content: first.content },
        {
          role: "user",
          content: toolUses.map((t, i) => ({
            type: "tool_result",
            tool_use_id: t.id,
            content: results[i].text,
          })),
        },
      ],
    });
    {
      const { inTok, outTok, cost } = costOf(second.usage);
      totalIn += inTok; totalOut += outTok; totalCost += cost;
    }
    const reply = second.content.find((b) => b.type === "text")?.text
      ?? results.map((r) => `${AGENTS[r.key].name}: ${r.text}`).join("\n\n");

    append(
      "foreman", "finished",
      "Delegated: " + text.slice(0, 100) + " -> " + results.map((r) => AGENTS[r.key].name).join(", "),
      JSON.stringify({ in: totalIn, out: totalOut, cost: Number(totalCost.toFixed(6)), model: MODEL }),
    );
    return reply;
  } catch (err) {
    append("foreman", "error", err.message?.slice(0, 200) ?? "unknown error");
    return `Foreman hit an error: ${err.message}`;
  }
}

bot.on("message:text", async (ctx) => {
  const threadId = ctx.message.message_thread_id;
  const key = agentForThread(threadId);
  const text = ctx.message.text;

  if (key === "foreman") {
    const reply = await runForeman(threadId, text);
    for (let i = 0; i < reply.length; i += 4000) {
      await ctx.reply(reply.slice(i, i + 4000), { message_thread_id: threadId });
    }
    return;
  }

  // Any other topic talks to that one specialist directly, no delegation.
  const agent = AGENTS[key];
  append(key, "started", text.slice(0, 120));
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: agent.system,
      messages: [{ role: "user", content: text }],
    });
    const reply = res.content.find((b) => b.type === "text")?.text ?? "(no response)";
    for (let i = 0; i < reply.length; i += 4000) {
      await ctx.reply(reply.slice(i, i + 4000), { message_thread_id: threadId });
    }
    logTurn(key, text, res.usage);
  } catch (err) {
    append(key, "error", err.message?.slice(0, 200) ?? "unknown error");
    await ctx.reply(`${agent.name} hit an error: ${err.message}`, { message_thread_id: threadId });
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
