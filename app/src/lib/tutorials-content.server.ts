import type { TutorialBlock } from "./tutorials";

// Server-only lesson content, keyed by tutorial slug. Never import this from
// client components; it is served through getTutorialContent, which trims
// gated tutorials to a preview for non-members.
export const tutorialBlocks: Record<string, TutorialBlock[]> = {
  "control-room-discord": [
    {
      kind: "p",
      text: "By the end of this build you'll run a six-agent AI crew: a Director who takes your instructions from Telegram and owns outcomes, and five specialists — Scout (research), Scribe (writing), Rig (engineering), Tally (numbers), and Relay (comms) — each answering in its own Discord channel. A four-tab Mission Control dashboard on your VPS shows the crew working live: a Command Center, per-agent stats, a task board, and a System Monitor that tracks token usage and estimated cost per agent. Every step is a copy-paste prompt into your coding agent on the server, followed by a quick check.",
    },
    {
      kind: "note",
      text: "This is an advanced build that spans two chat platforms — Telegram for the Director, Discord for the crew. If this is your first agent-on-a-VPS project, do the Telegram Ops Bot tutorial first for the server basics.",
    },
    {
      kind: "part",
      num: 1,
      total: 5,
      title: "Foundation — the Director & the house rules",
      blurb:
        "Stand up the top-level coordinator on Telegram, let it learn who you are, and lock in the permanent rules the whole crew runs by.",
    },
    { kind: "h2", text: "1. Give the Director its identity" },
    {
      kind: "p",
      text: "The Director is the only agent you talk to directly, and it lives on Telegram so you can reach it from your pocket. It delegates to the Discord specialists, checks their work, and returns finished results.",
    },
    {
      kind: "prompt",
      num: "1",
      title: "Introduce the Director & meet the owner",
      text: "Your name is Director. You are the top-level coordinator of my Control Room — a six-agent\nAI crew — and you operate from Telegram as the command layer. The five specialists live on\nDiscord, each in its own channel. I am the owner and hold final authority.\n\nHere's who I am:\n- My name: [YOUR NAME]\n- What I do: [your work / role]\n- What I'm working on right now: [current focus]\n- Time zone & working hours: [e.g. EST, 9-6]\n- People I must never drop the ball on: [key clients or collaborators]\n\nYour crew: SCOUT (research), SCRIBE (writing), RIG (engineering & the dashboard we'll build),\nTALLY (numbers & tracking), RELAY (comms & coordination across the crew). You take my\ninstruction, delegate to the right specialist on Discord, verify the work, and bring me a\nfinished result — you own outcomes, not handoffs.\n\nSave all of this to long-term memory. Confirm, and name yourself and me back to me in one line.",
    },
    { kind: "h2", text: "2. Let the Director interview you" },
    {
      kind: "prompt",
      num: "2",
      title: "Let the Director fill its own gaps",
      text: "You now know the basics about me. Before we hire the crew, close the gaps.\n\nAsk me the follow-up questions you actually need to coordinate a great team — one at a time,\nwaiting for each answer. Think about what Scout, Scribe, Rig, Tally, and Relay will each need:\nmy audience and voice, what I'm shipping or promoting, my goals and constraints, and the\ntools I already use. Keep going until you understand me well enough to brief the specialists,\nthen stop and summarise what you learned. Save it all to long-term memory.",
    },
    { kind: "h2", text: "3. Install the house rules" },
    {
      kind: "prompt",
      num: "3",
      title: "Install the permanent house rules",
      text: "These are your permanent operating rules. Follow them in every interaction.\n\nPROGRESS\nOn any multi-step task, send a short status line before each step:\n[Agent]: Step X of Y — [what you're doing]. Never go silent over 60 seconds on active work.\n\nAPPROVAL\nShow me your plan before you act on anything that posts publicly, spends money, or changes a\nfile outside your own workspace.\n\nCOMMUNICATION\nShort and clear. Label options 1, 2, 3. Lead with the decision I need to make. No \"Certainly\"\nor \"Great question\" openers.\n\nDELEGATION\nName the specialist you're routing to and why, in one line. Never fabricate a result.\n\nConfirm all rules are saved to long-term memory.",
    },
    {
      kind: "part",
      num: 2,
      total: 5,
      title: "The crew — five specialists",
      blurb:
        "Create Scout, Scribe, Rig, Tally, and Relay — each with its own memory, its own workspace, and a clear line it doesn't cross.",
    },
    { kind: "h2", text: "4. Hire the five specialists" },
    {
      kind: "prompt",
      num: "4",
      title: "Create the specialist crew",
      text: "Create five specialist agents, each with its own persistent identity and memory. For each,\nwrite a short charter and save it to that agent's long-term memory.\n\nSCOUT — research & monitoring. Finds sources, tracks changes, summarises what's new. Never\nships code or final content.\nSCRIBE — writing & content. Turns Scout's findings and my direction into drafts in my voice.\nNever invents facts; asks Scout when unsure.\nRIG — engineering & automation. Writes and runs code, builds the dashboard, manages the\nserver. The only agent allowed to touch the filesystem or run commands.\nTALLY — numbers & tracking. Keeps the running record of tasks, outcomes, and metrics.\nReports; never acts on my behalf.\nRELAY — comms & coordination. Keeps the crew in sync, drafts summaries for the Director, and\nrelays cross-agent handoffs. Never overrides the Director.\n\nFor each agent, confirm the charter is saved and have it introduce itself in one line.",
    },
    { kind: "h2", text: "5. Isolated workspaces & role boundaries" },
    {
      kind: "prompt",
      num: "5",
      title: "Give each agent its own workspace",
      text: "Set up isolation so the crew can't step on each other.\n\n- Create a working directory per agent under /opt/control-room/<agent>/ (scout, scribe, rig,\n  tally, relay). Each agent reads and writes only inside its own directory, except Rig, which\n  may operate across the project when I explicitly approve a plan.\n- Each agent keeps its own memory namespace — no shared memory except the logbook we build\n  in Part 4.\n- Reinforce the boundaries: only Rig runs commands or edits files; only Tally writes to the\n  tracking record; Scout and Scribe produce text, not actions.\n\nShow me the directory tree and confirm each agent's boundary in one line.",
    },
    { kind: "h2", text: "6. Shared crew awareness" },
    {
      kind: "prompt",
      num: "6",
      title: "Give the crew shared awareness",
      text: "Give every agent a shared, read-only picture of the team so they hand off well.\n\nWrite a short \"crew sheet\" — each agent's name, role, and the one thing to route to them for —\nand load it into every agent's context. When an agent hits something outside its role, it names\nthe right specialist and hands back to the Director rather than doing it itself.\n\nConfirm each agent can name the other four and what they're for.",
    },
    {
      kind: "part",
      num: 3,
      total: 5,
      title: "Discord — server, channels & bindings",
      blurb:
        "Wire the crew to Discord, give each specialist its own channel in a tidy category, and bind each agent so a message in #rig is answered by Rig.",
    },
    { kind: "h2", text: "7. Wire the crew to Discord" },
    {
      kind: "p",
      text: "In Discord, create (or pick) a server where you're admin. In the Developer Portal, make a bot application, copy its token, enable the Message Content intent, and invite the bot to your server with permission to read and send messages.",
    },
    {
      kind: "prompt",
      num: "7",
      title: "Connect the crew to Discord",
      text: "Wire the Control Room crew to my Discord server using a bot.\n\n- Read the DISCORD_BOT_TOKEN from /opt/control-room/.env.\n- Connect with the Message Content intent enabled.\n- Owner lock: only obey messages from my Discord user id (DISCORD_OWNER_ID in .env) — ignore\n  everyone else silently.\n- For now, add one command: posting \"roll call\" in any channel makes the bot reply\n  \"Control Room online\" so I can confirm the connection and permissions.\n\nShow me how to run it and how to verify the owner lock with a second account.",
    },
    { kind: "h2", text: "8. Create the channels & category groups" },
    {
      kind: "prompt",
      num: "8",
      title: "Create channels & categories",
      text: "Help me lay out the Discord server for the crew.\n\n- One text channel per specialist: #scout, #scribe, #rig, #tally, #relay, plus a #director-bridge\n  channel for broadcasts.\n- Group them into two categories: \"CREW\" (the five specialists) and \"CONTROL\" (director-bridge\n  and a #logs channel).\n- Tell me the exact steps to create these in Discord, then how to capture each channel's numeric\n  channel ID (I'll paste them for the next step).",
    },
    { kind: "h2", text: "9. Bind each agent to its channel" },
    {
      kind: "prompt",
      num: "9",
      title: "Build the channel router",
      text: "I'll paste the numeric channel id for each specialist channel. Build the router:\n\n- A map from channel id to agent (scout, scribe, rig, tally, relay).\n- On each incoming message, look up the channel id and dispatch to that agent's handler with\n  that agent's identity and memory. Messages in #director-bridge go to the Director bridge.\n- Reply in the same channel the message came from. Reject anything from a non-owner id.\n\nChannel ids:\nScout: [ID]  Scribe: [ID]  Rig: [ID]  Tally: [ID]  Relay: [ID]\n\nThen explain in two sentences how a message in #rig reaches Rig and not the Director.",
    },
    {
      kind: "code",
      lang: "bash",
      label: "verify — each channel answers as itself",
      code: "# In #rig:    \"who are you?\"  -> answers as Rig\n# In #scout:  \"who are you?\"  -> answers as Scout\n# From a non-owner account in any channel -> silence",
    },
    {
      kind: "part",
      num: 4,
      total: 5,
      title: "The logbook — logging & token-cost capture",
      blurb:
        "One shared, append-only record of who did what — and how many tokens it cost. This is the data the System Monitor tab reads.",
    },
    { kind: "h2", text: "10. Create the shared logbook" },
    {
      kind: "prompt",
      num: "10",
      title: "Build the shared logbook",
      text: "Build a shared activity logbook the whole crew writes to.\n\n- A SQLite database at /opt/control-room/logbook.db with a table `events` (id, ts, agent, kind,\n  summary, detail). kind is one of: started, finished, handoff, error, note.\n- Give every agent one helper it calls to append an event — one line per meaningful action.\n- The Director writes a `handoff` event when it delegates and a `finished` event when it returns\n  a result to me.\n\nAfter a test task, show me the last 10 rows.",
    },
    { kind: "h2", text: "11. Capture token usage & cost" },
    {
      kind: "p",
      text: "This is what powers the System Monitor. On every model call, record how many tokens went in and out, and compute an estimated cost — so the dashboard can show spend per agent.",
    },
    {
      kind: "prompt",
      num: "11",
      title: "Log tokens and estimated cost per call",
      text: "Extend the logbook so every agent's model call records its token usage.\n\n- When an agent finishes a turn, read the input and output token counts from the model\n  response's usage field.\n- Compute an estimated cost using per-million-token prices from PRICE_IN and PRICE_OUT in\n  .env (default $3 in / $15 out per million).\n- Store it in the `finished` event's detail column as JSON: {\"in\": N, \"out\": N, \"cost\": N,\n  \"model\": \"...\"}.\n\nRun a test turn and show me the detail JSON that was written.",
    },
    {
      kind: "part",
      num: 5,
      total: 5,
      title: "Mission Control — the four-tab dashboard",
      blurb:
        "A read-only dashboard on your VPS with four tabs — Command Center, Agents, Tasks, and a System Monitor that charts token usage and cost per agent. Read-only where it counts, so it can never break the crew.",
    },
    { kind: "h2", text: "12. Build the read-only data layer" },
    {
      kind: "prompt",
      num: "12",
      title: "Build the read-only data layer",
      text: "Have Rig build a small read-only API for the dashboard.\n\n- A service at /opt/control-room/board/ that opens logbook.db in READ-ONLY mode — never writes.\n- Endpoints: /api/stats (agents active, turns today, cost today, errors today, tokens, model),\n  /api/agents (each agent + status + turns + cost), /api/events (recent, newest first),\n  /api/tasks (open items and today's finished items).\n- Bind to localhost only; we expose it privately in the last step.\n\nShow me a curl of /api/stats.",
    },
    { kind: "h2", text: "13. Wire the four tabs live" },
    {
      kind: "prompt",
      num: "13",
      title: "Build the four-tab dashboard",
      text: "Build the Mission Control front end and connect it to the data layer.\n\n- A single dark page (navy background, gold accent, monospace labels) with four tabs:\n  1. COMMAND CENTER — KPI tiles (agents active, turns today, est. cost today, errors) + a live\n     event feed + crew status.\n  2. AGENTS — a card per specialist: name, status dot (green if active in the last 5 min), turns,\n     and cost.\n  3. TASKS — two columns: In Progress and Done Today.\n  4. SYSTEM MONITOR — model in use, tokens in/out today, total cost, and a per-agent table of\n     turns, tokens, and estimated cost with usage bars.\n- Poll the read-only API every few seconds. Read-only — no controls that change crew state.\n\nGive me the URL to open it on my LAN.",
    },
    {
      kind: "code",
      lang: "bash",
      label: "verify — the dashboard is live",
      code: "# Trigger any agent (post in #scout)\n# Watch Mission Control: Scout's dot goes green, a new event appears,\n# and the System Monitor's cost ticks up.\ncurl -s http://127.0.0.1:8787/api/stats | head",
    },
    { kind: "h2", text: "14. Secure remote access" },
    {
      kind: "prompt",
      num: "14",
      title: "Reach Mission Control safely from anywhere",
      text: "I want to open Mission Control from my laptop and phone without exposing it to the public\ninternet. Set up Tailscale (or an equivalent private mesh) on the VPS so only my own devices\ncan reach the dashboard. Do NOT open the dashboard port on the public firewall. Give me the\nprivate URL and confirm the public firewall still blocks the port.",
    },
    { kind: "h2", text: "Troubleshooting" },
    {
      kind: "prompt",
      num: "T1",
      title: "Every channel answers as the Director",
      text: "Every Discord channel is answering as the Director instead of its own specialist. Diagnose the\nrouter: confirm the channel-id map matches the real numeric ids (print both side by side),\nconfirm the dispatcher reads the message's channel id, and confirm each agent handler loads its\nown identity. Show me the mismatch before changing anything.",
    },
    {
      kind: "prompt",
      num: "T2",
      title: "The System Monitor shows $0.00",
      text: "The System Monitor's cost stays at zero even though the crew is active. Check, in order: that\n`finished` events are writing the detail JSON with token counts (show the last 3 rows), that the\nmodel response actually includes a usage field, and that the dashboard's /api/stats reads\njson_extract on the detail column. Report which link is broken before fixing it.",
    },
    {
      kind: "note",
      text: "That's the whole build: a Director on Telegram, five specialists on their own Discord channels, a shared logbook that captures token cost, and a four-tab Mission Control that shows the crew — and the spend — live. Point the crew at your own work and you've got a standing team with a cost dashboard, all on one small VPS.",
    },
  ],

  "pit-crew-mission-control": [
    {
      kind: "p",
      text: "By the end of this build you'll have a five-agent AI crew living on Telegram: a Foreman who takes your instructions and owns outcomes, four specialists — Radar (research), Quill (writing), Wrench (engineering), and Ledger (numbers and tracking) — each answering in its own channel, and a live read-only Pit Board dashboard on your VPS that shows what every agent is doing right now. The whole thing is driven by copy-paste prompts: each one goes into your coding agent on the server, and after each you run a quick check so you know it landed before moving on.",
    },
    {
      kind: "note",
      text: "This is an advanced build. If you've never stood up an agent on a VPS before, do the Telegram Ops Bot tutorial first — it covers the server basics this one assumes.",
    },
    {
      kind: "part",
      num: 1,
      total: 6,
      title: "Foundation — the Foreman & the shop rules",
      blurb:
        "Stand up the top-level coordinator, let it learn who you are and what you're working on, and lock in the permanent rules the whole crew runs by.",
    },
    { kind: "h2", text: "1. Give the Foreman its identity" },
    {
      kind: "p",
      text: "The Foreman is the only agent you talk to directly. It delegates to the specialists, checks their work, and brings you finished results — not half-done handoffs. Start by telling it who it is and who you are.",
    },
    {
      kind: "prompt",
      num: "1",
      title: "Introduce the Foreman & meet the owner",
      text: "Your name is Foreman. You are the top-level coordinator of my Pit Crew — a small team of\nAI specialists — and you operate from Telegram as the control layer. I am the owner and\nhold final authority; I can instruct you directly at any time.\n\nHere's who I am and what you're helping me with:\n- My name: [YOUR NAME]\n- What I do: [your work / business / role]\n- What I'm working on right now: [current focus or goals]\n- My time zone and rough working hours: [e.g. CET, 9-6, evenings off]\n- People I must never drop the ball on: [key clients or collaborators]\n\nYou coordinate four specialists on my behalf: RADAR (research and monitoring), QUILL\n(writing and content), WRENCH (engineering, automation, and the dashboard we'll build),\nand LEDGER (numbers, tracking, and reporting). You take my instruction, delegate to the\nright specialist, verify the work, and return a finished result.\n\nMost importantly: you own outcomes. When a task spans several specialists, coordinate the\nwhole thing end to end and come back with something done — not a status update. Think\ncapable chief of staff, not switchboard.\n\nSave all of this to long-term memory. Confirm you've got it, and name yourself and me back\nto me in one line.",
    },
    { kind: "h2", text: "2. Let the Foreman interview you" },
    {
      kind: "prompt",
      num: "2",
      title: "Let the Foreman fill its own gaps",
      text: "You now know the basics about me. Before we hire the crew, close the gaps.\n\nAsk me the follow-up questions you actually need to coordinate a great team — one at a\ntime, waiting for each answer. Think about what Radar, Quill, Wrench, and Ledger will each\nneed: my audience and voice, what I'm promoting or shipping, my goals and constraints, and\nthe tools I already use. Keep going until you understand me well enough to brief the\nspecialists, then stop.\n\nWhen you're done, summarise what you've learned and save it all to long-term memory —\nyou'll pass the relevant parts to each specialist later. Confirm once it's saved.",
    },
    { kind: "h2", text: "3. Install the shop rules" },
    {
      kind: "prompt",
      num: "3",
      title: "Install the permanent shop rules",
      text: "These are your permanent operating rules. Follow them in every interaction.\n\nPROGRESS\nOn any task with more than one step, send a short status line before each step:\n[Agent]: Step X of Y — [what you're doing]. Never go silent for over 60 seconds on an\nactive task.\n\nAPPROVAL\nShow me your plan before you act on anything that sends a message, spends money, or\nchanges a file outside your own workspace.\n\nCOMMUNICATION\nShort and clear. Label options 1, 2, 3. Lead with the decision I need to make. Never open\nwith \"Great question\" or \"Certainly.\"\n\nDELEGATION\nIn one line, name the specialist you're routing to and why. Never fabricate a result — if\nsomething failed, say so plainly.\n\nConfirm all rules are saved to long-term memory.",
    },
    {
      kind: "part",
      num: 2,
      total: 6,
      title: "The specialist crew",
      blurb:
        "Create Radar, Quill, Wrench, and Ledger — each with its own memory, its own workspace, and a clear line it doesn't cross.",
    },
    { kind: "h2", text: "4. Hire the four specialists" },
    {
      kind: "prompt",
      num: "4",
      title: "Create the specialist crew",
      text: "Create four specialist agents, each with its own persistent identity and memory. For each,\nwrite a short charter and save it to that agent's long-term memory.\n\nRADAR — research & monitoring. Finds sources, tracks changes, summarises what's new. Never\nwrites final content or ships code.\nQUILL — writing & content. Turns Radar's findings and my direction into drafts in my voice.\nNever invents facts; asks Radar when unsure.\nWRENCH — engineering & automation. Writes and runs code, builds the dashboard, manages the\nserver. The only agent allowed to touch the filesystem or run commands.\nLEDGER — numbers & tracking. Keeps the running record of tasks, outcomes, and metrics.\nReports; never acts on my behalf.\n\nFor each agent, confirm the charter is saved and have it introduce itself in one line.",
    },
    { kind: "h2", text: "5. Isolated workspaces & role boundaries" },
    {
      kind: "prompt",
      num: "5",
      title: "Give each agent its own workspace",
      text: "Set up isolation so the crew can't step on each other.\n\n- Create a working directory per agent under /opt/pit-crew/<agent>/ (radar, quill, wrench,\n  ledger). Each agent reads and writes only inside its own directory, except Wrench, which\n  may operate across the project when I explicitly approve a plan.\n- Each agent keeps its own memory namespace — no shared memory except the logbook we build\n  in Part 4.\n- Reinforce the boundaries from the charters: only Wrench runs commands or edits files; only\n  Ledger writes to the tracking record; Radar and Quill produce text, not actions.\n\nShow me the directory tree and confirm each agent's boundary back to me in one line.",
    },
    { kind: "h2", text: "6. Shared crew awareness" },
    {
      kind: "prompt",
      num: "6",
      title: "Give the crew shared awareness",
      text: "Give every agent a shared, read-only picture of the team so they can hand off well.\n\nWrite a short \"crew sheet\" — each agent's name, role, and the one thing to route to them\nfor — and load it into every agent's context. When an agent hits something outside its\nrole, it should name the right specialist and hand back to the Foreman rather than doing\nit itself.\n\nConfirm each agent can name the other three and what they're for.",
    },
    {
      kind: "part",
      num: 3,
      total: 6,
      title: "Telegram routing — one channel per agent",
      blurb:
        "Put each agent in its own Telegram topic thread so a message in the Wrench channel is answered by Wrench, not the Foreman.",
    },
    { kind: "h2", text: "7. Create the group and topic threads" },
    {
      kind: "p",
      text: "In Telegram, create a group, enable Topics in the group settings, and add your bot as an admin. Make one topic per agent — Foreman, Radar, Quill, Wrench, Ledger — plus a General topic for broadcasts.",
    },
    {
      kind: "prompt",
      num: "7",
      title: "Brief the crew on the routing plan",
      text: "We're about to route each agent to its own Telegram topic thread so messages land with the\nright specialist. Here's the plan — read it back to me and flag anything unclear before we\nbuild:\n\n- One Telegram group with Topics enabled; the bot is admin.\n- One topic per agent (Foreman, Radar, Quill, Wrench, Ledger) plus General.\n- Each incoming message is routed to the agent that owns its topic thread. A message in the\n  Wrench topic is handled by Wrench; General goes to the Foreman.\n- Replies post back into the same topic they came from.\n\nConfirm the plan, then wait — I'll capture the topic thread IDs next.",
    },
    { kind: "h2", text: "8. Capture the thread IDs and build the router" },
    {
      kind: "prompt",
      num: "8",
      title: "Build the routing layer",
      text: "I'll paste the numeric message_thread_id for each topic. Build the router:\n\n- A map from thread ID to agent (foreman, radar, quill, wrench, ledger).\n- On each incoming Telegram update, look up the thread ID and dispatch to that agent's\n  handler with that agent's identity and memory. Unknown thread or General -> Foreman.\n- Post every reply back into the originating message_thread_id.\n- Reject and log any update from a user id that isn't mine.\n\nHere are my thread IDs:\nForeman: [ID]  Radar: [ID]  Quill: [ID]  Wrench: [ID]  Ledger: [ID]\n\nWhen it's built, tell me in two sentences how a message in the Wrench topic reaches Wrench\nand not the Foreman.",
    },
    {
      kind: "code",
      lang: "bash",
      label: "verify — each channel answers as itself",
      code: "# In the Wrench topic: \"who are you?\"  -> answers as Wrench\n# In the Radar topic:  \"who are you?\"  -> answers as Radar\n# In General:          \"who are you?\"  -> answers as Foreman",
    },
    { kind: "h2", text: "9. Verify true routing" },
    {
      kind: "prompt",
      num: "9",
      title: "Prove the isolation holds",
      text: "Run a routing self-test and report a table of results:\n\n1. Post \"state your name and role in one line\" into each of the five topics.\n2. Confirm each reply comes from the correct agent, in the correct topic thread.\n3. Confirm Wrench is the only one that will offer to run a command, and Ledger the only one\n   that will offer to update the tracking record.\n\nIf any topic answers as the wrong agent, stop and show me the thread-ID map — don't try to\nself-fix the routing yet.",
    },
    {
      kind: "part",
      num: 4,
      total: 6,
      title: "The logbook — activity logging & memory",
      blurb:
        "One shared, append-only record of who did what and when — the data the Pit Board reads from, and the crew's shared memory of the day.",
    },
    { kind: "h2", text: "10. Create the shared logbook" },
    {
      kind: "prompt",
      num: "10",
      title: "Build the shared logbook",
      text: "Build a shared activity logbook the whole crew writes to.\n\n- A small SQLite database at /opt/pit-crew/logbook.db with a table `events` (id, ts,\n  agent, kind, summary, detail). kind is one of: started, finished, handoff, error, note.\n- Give every agent a single helper it calls to append an event — one line per meaningful\n  action. No agent reads another's private memory; the logbook is the only shared view.\n- The Foreman writes a `handoff` event whenever it delegates, and a `finished` event when\n  it returns a result to me.\n\nAfter a test task, show me the last 10 rows of the logbook.",
    },
    { kind: "h2", text: "11. Nightly log rotation" },
    {
      kind: "prompt",
      num: "11",
      title: "Keep the logbook from growing forever",
      text: "Add retention so the logbook stays healthy without me managing it.\n\n- A nightly job (cron or systemd timer) that archives events older than 30 days into\n  /opt/pit-crew/archive/logbook-YYYY-MM.db and deletes them from the live table.\n- Never touch events newer than 30 days. Log the rotation itself as a `note` event.\n\nShow me the timer and confirm the next run time.",
    },
    {
      kind: "part",
      num: 5,
      total: 6,
      title: "The Pit Board — live dashboard",
      blurb:
        "A read-only web dashboard on your VPS that renders the logbook live: who's active, the latest handoffs, and the running task list — nothing writable, so the dashboard can never break the crew.",
    },
    { kind: "h2", text: "12. Build the read-only data layer" },
    {
      kind: "p",
      text: "The dashboard reads; it never writes. That single rule is what keeps a flaky web page from ever corrupting the crew's state.",
    },
    {
      kind: "prompt",
      num: "12",
      title: "Build the read-only data layer",
      text: "Have Wrench build a small read-only API for the dashboard.\n\n- A Python (FastAPI) or Node service at /opt/pit-crew/board/ that opens logbook.db in\n  READ-ONLY mode — it must never write.\n- Endpoints: GET /api/agents (each agent + last activity + active/idle), GET /api/events\n  (recent events, newest first, with a limit), GET /api/tasks (open items derived from\n  started/finished pairs).\n- Bind to localhost only; we'll expose it safely in the next step.\n\nShow me a curl of /api/agents.",
    },
    { kind: "h2", text: "13. Build the Pit Board and wire it live" },
    {
      kind: "prompt",
      num: "13",
      title: "One dark page, five cards",
      text: "Build the Pit Board front end and connect it to the data layer.\n\n- A single dark dashboard page (dark navy background, panels, a gold accent, monospace\n  labels): a row of agent cards, each with name, role, and a status dot that glows green\n  when the agent acted in the last 5 minutes and is grey when idle.\n- Below the cards: a live event feed and a task list.\n- Poll the read-only API every few seconds (or use SSE) so the board updates without a\n  refresh. Read-only — no buttons that change crew state.\n\nShow me the URL to open it on my LAN, and confirm the dots update when an agent acts.",
    },
    {
      kind: "code",
      lang: "bash",
      label: "verify — the board is live",
      code: "# Trigger any agent (e.g. ask Radar something in its topic)\n# Watch the Pit Board: Radar's dot goes green, a new event appears in the feed\ncurl -s http://127.0.0.1:8000/api/agents | head",
    },
    { kind: "h2", text: "Secure remote access" },
    {
      kind: "prompt",
      num: "14",
      title: "Reach the Pit Board safely from anywhere",
      text: "I want to open the Pit Board from my laptop and phone without exposing it to the public\ninternet.\n\nSet up Tailscale (or an equivalent private mesh) on the VPS so only my own devices can\nreach the dashboard. Do NOT open the dashboard port on the public firewall. Once it's up,\ngive me the private URL I'll use, and confirm the public firewall still blocks the port.",
    },
    {
      kind: "part",
      num: 6,
      total: 6,
      title: "Troubleshooting prompts",
      blurb: "Keep these two on hand for the failure modes this build hits most often.",
    },
    {
      kind: "prompt",
      num: "T1",
      title: "Every channel answers as the Foreman",
      text: "Every Telegram topic is answering as the Foreman instead of its own specialist. Diagnose\nthe router: confirm the thread-ID map matches the real message_thread_id of each topic\n(print both side by side), confirm the dispatcher reads message_thread_id and not chat_id,\nand confirm each agent handler is loaded with its own identity. Show me the mismatch before\nchanging anything.",
    },
    {
      kind: "prompt",
      num: "T2",
      title: "The Pit Board shows stale data",
      text: "The Pit Board isn't updating — the dots stay grey even when agents are active. Check, in\norder: that agents are actually appending to logbook.db (show the last 5 rows with\ntimestamps), that the read-only API sees the same database file the agents write, and that\nthe front end is actually polling (show me a network request). Report which link in the\nchain is broken before fixing it.",
    },
    {
      kind: "note",
      text: "That's the whole build: a Foreman who owns outcomes, four specialists routed to their own Telegram channels, a shared logbook, and a live Pit Board that shows the crew working — all read-only where it counts, so nothing on the dashboard can ever break the fleet. Point the crew at your own work and it becomes a standing team you delegate to from your pocket.",
    },
  ],

  "inbox-zero-agent": [
    {
      kind: "p",
      text: "By the end of this build you will have a small service that checks your inbox every five minutes, labels each message, and drafts replies for the ones that need you. Everything runs on your own machine.",
    },
    { kind: "h2", text: "What you need" },
    {
      kind: "p",
      text: "A Gmail account with an app password, Node 20 or newer, and an Anthropic API key. Budget about 45 minutes.",
    },
    { kind: "h2", text: "1. Scaffold the project" },
    {
      kind: "code",
      lang: "bash",
      label: "terminal",
      code: "mkdir inbox-agent && cd inbox-agent\nnpm init -y\nnpm install imapflow nodemailer @anthropic-ai/sdk dotenv",
    },
    {
      kind: "p",
      text: "Create a .env file with your credentials. The app password comes from your Google account security page, not your normal password.",
    },
    {
      kind: "code",
      lang: "bash",
      label: ".env",
      code: "GMAIL_USER=you@gmail.com\nGMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx\nANTHROPIC_API_KEY=sk-ant-...",
    },
    { kind: "h2", text: "2. Read the inbox" },
    {
      kind: "code",
      lang: "js",
      label: "fetch.js",
      code: 'import { ImapFlow } from "imapflow";\nimport "dotenv/config";\n\nexport async function fetchUnread() {\n  const client = new ImapFlow({\n    host: "imap.gmail.com",\n    port: 993,\n    secure: true,\n    auth: {\n      user: process.env.GMAIL_USER,\n      pass: process.env.GMAIL_APP_PASSWORD,\n    },\n  });\n  await client.connect();\n  const lock = await client.getMailboxLock("INBOX");\n  const messages = [];\n  try {\n    for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true })) {\n      messages.push({\n        uid: msg.uid,\n        from: msg.envelope.from?.[0]?.address ?? "unknown",\n        subject: msg.envelope.subject ?? "(no subject)",\n        body: msg.source.toString().slice(0, 4000),\n      });\n    }\n  } finally {\n    lock.release();\n    await client.logout();\n  }\n  return messages;\n}',
    },
    { kind: "h2", text: "3. Let the model triage" },
    {
      kind: "p",
      text: "One call per message. The model returns a category and, when the category is reply, a draft. Keeping the schema tiny is what makes this reliable.",
    },
    {
      kind: "code",
      lang: "js",
      label: "triage.js",
      code: 'import Anthropic from "@anthropic-ai/sdk";\n\nconst anthropic = new Anthropic();\n\nexport async function triage(message) {\n  const res = await anthropic.messages.create({\n    model: "claude-sonnet-5",\n    max_tokens: 500,\n    messages: [\n      {\n        role: "user",\n        content: `Triage this email. Reply with JSON only:\\n{"category": "reply" | "read-later" | "ignore", "draft": string}\\n\\nFROM: ${message.from}\\nSUBJECT: ${message.subject}\\n\\n${message.body}`,\n      },\n    ],\n  });\n  return JSON.parse(res.content[0].text);\n}',
    },
    { kind: "h2", text: "4. Wire the loop" },
    {
      kind: "code",
      lang: "js",
      label: "index.js",
      code: 'import { fetchUnread } from "./fetch.js";\nimport { triage } from "./triage.js";\n\nasync function run() {\n  const messages = await fetchUnread();\n  for (const msg of messages) {\n    const result = await triage(msg);\n    console.log(`[${result.category}] ${msg.subject}`);\n    if (result.category === "reply") {\n      console.log(`  draft: ${result.draft.slice(0, 120)}...`);\n    }\n  }\n}\n\nrun();\nsetInterval(run, 5 * 60 * 1000);',
    },
    {
      kind: "note",
      text: "Run it with node index.js. From here, the members version of this build adds approval buttons over Telegram and automatic label sync back to Gmail.",
    },
  ],

  "telegram-ops-bot": [
    {
      kind: "p",
      text: "You will build a Telegram bot that lives on your server. Ask it how the box is doing and it answers with real numbers. Tell it to restart a service and it does, after asking you to confirm. The build is driven by copy-paste prompts: each one goes into Claude Code running on your server, and after each prompt you run a quick verification so you know the step actually landed.",
    },
    {
      kind: "part",
      num: 1,
      total: 3,
      title: "Foundation — the bot & its owner lock",
      blurb:
        "Register the bot with Telegram, scaffold the project, and hard-lock it so it answers you and nobody else.",
    },
    { kind: "h2", text: "1. Create the bot with BotFather" },
    {
      kind: "p",
      text: "Message @BotFather on Telegram, send /newbot, pick a name, and copy the token it gives you. Also message @userinfobot to get your numeric user id: the bot must only obey you.",
    },
    {
      kind: "prompt",
      num: "1",
      title: "Scaffold the ops bot",
      text: "Create a new Node project in /opt/ops-bot for a Telegram ops bot.\n\n- Use the grammy library for Telegram, systeminformation for metrics, and dotenv for config.\n- Create a .env file with two placeholders: BOT_TOKEN and OWNER_ID.\n- In bot.js, add a middleware FIRST that drops any update where ctx.from.id does not\n  equal OWNER_ID. No reply, no error — silently ignore strangers.\n- Add a /ping command that replies \"on the bench\" so I can verify the owner lock.\n\nDon't add any other commands yet. Show me the file tree when you're done.",
    },
    {
      kind: "code",
      lang: "bash",
      label: "verify — only YOU get a reply",
      code: "cd /opt/ops-bot\nnode bot.js\n# in Telegram: send /ping  ->  \"on the bench\"\n# from a second account: send /ping  ->  silence",
    },
    {
      kind: "part",
      num: 2,
      total: 3,
      title: "Health reports & safe restarts",
      blurb:
        "A /status command with real numbers, a whitelist of services the bot may touch, and a confirmation tap before anything restarts.",
    },
    { kind: "h2", text: "2. Report system health" },
    {
      kind: "prompt",
      num: "2",
      title: "Add the /status health report",
      text: "Add a /status command to bot.js.\n\nIt should report, in one short message: CPU load percentage, memory used percentage,\nand disk used percentage for the root filesystem — using the systeminformation\nlibrary, no shelling out. Keep the reply format to three lines, lowercase, like:\n\ncpu 12%\nmem 48%\ndisk 61%\n\nNo emoji, no headers, no extra prose.",
    },
    {
      kind: "p",
      text: "The generated command should look close to this — read it before you trust it:",
    },
    {
      kind: "code",
      lang: "js",
      label: "bot.js",
      code: 'import { Bot } from "grammy";\nimport si from "systeminformation";\nimport "dotenv/config";\n\nconst bot = new Bot(process.env.BOT_TOKEN);\nconst OWNER = Number(process.env.OWNER_ID);\n\nbot.use((ctx, next) => {\n  if (ctx.from?.id !== OWNER) return;\n  return next();\n});\n\nbot.command("status", async (ctx) => {\n  const [cpu, mem, disk] = await Promise.all([\n    si.currentLoad(),\n    si.mem(),\n    si.fsSize(),\n  ]);\n  const memUsed = ((1 - mem.available / mem.total) * 100).toFixed(0);\n  const diskUsed = disk[0] ? disk[0].use.toFixed(0) : "?";\n  await ctx.reply(\n    `cpu ${cpu.currentLoad.toFixed(0)}%\\nmem ${memUsed}%\\ndisk ${diskUsed}%`,\n  );\n});\n\nbot.start();',
    },
    { kind: "h2", text: "3. Restart services safely" },
    {
      kind: "p",
      text: "Never let a chat message run arbitrary shell. Whitelist the exact services the bot may touch and require a confirmation tap.",
    },
    {
      kind: "prompt",
      num: "3",
      title: "Safe restarts with a confirmation tap",
      text: "Add a /restart command to bot.js.\n\n- Define a SERVICES whitelist constant: [\"nginx\", \"ops-bot\", \"postgresql\"].\n- /restart <name>: if the name is not in the whitelist, reply with the list of\n  allowed services and do nothing else.\n- If it IS whitelisted, do NOT restart yet. Reply with an inline keyboard with a\n  single button: \"Yes, restart <name>\". Only when I tap that button, run\n  `sudo systemctl restart <name>` via execFile (never a shell string), and reply\n  with the outcome.\n- Under no circumstances accept a service name that isn't in the whitelist,\n  even via the callback data.\n\nAfter you're done, explain in two sentences how the callback data is validated.",
    },
    {
      kind: "code",
      lang: "js",
      label: "bot.js (continued)",
      code: 'import { execFile } from "node:child_process";\nimport { InlineKeyboard } from "grammy";\n\nconst SERVICES = ["nginx", "ops-bot", "postgresql"];\n\nbot.command("restart", async (ctx) => {\n  const name = ctx.match?.trim();\n  if (!SERVICES.includes(name)) {\n    return ctx.reply(`I can restart: ${SERVICES.join(", ")}`);\n  }\n  const kb = new InlineKeyboard().text(`Yes, restart ${name}`, `go:${name}`);\n  await ctx.reply(`Restart ${name}?`, { reply_markup: kb });\n});\n\nbot.callbackQuery(/go:(.+)/, async (ctx) => {\n  const name = ctx.match[1];\n  execFile("sudo", ["systemctl", "restart", name], (err) => {\n    ctx.reply(err ? `Failed: ${err.message}` : `${name} restarted.`);\n  });\n  await ctx.answerCallbackQuery();\n});',
    },
    {
      kind: "part",
      num: 3,
      total: 3,
      title: "Run forever + troubleshooting",
      blurb:
        "Turn the script into a systemd service that survives reboots, then keep two troubleshooting prompts on hand for when Telegram goes quiet.",
    },
    { kind: "h2", text: "4. Keep it alive" },
    {
      kind: "prompt",
      num: "4",
      title: "Install it as a systemd service",
      text: "Create a systemd unit for the ops bot.\n\n- Unit file at /etc/systemd/system/ops-bot.service.\n- Runs /opt/ops-bot/bot.js with node, as the `ops` user (create the user if it\n  doesn't exist, no login shell), Restart=always, EnvironmentFile pointing at\n  /opt/ops-bot/.env.\n- Give the `ops` user sudo rights for `systemctl restart` on ONLY the three\n  whitelisted services, via a drop-in in /etc/sudoers.d/ — nothing broader.\n- Enable and start the service, then show me its status.",
    },
    {
      kind: "code",
      lang: "bash",
      label: "verify — the unit is live",
      code: "systemctl status ops-bot --no-pager\n# expect: active (running)\nsudo reboot\n# after the box is back: /ping from Telegram still answers",
    },
    { kind: "h2", text: "Troubleshooting" },
    {
      kind: "prompt",
      num: "T1",
      title: "The bot stopped answering",
      text: "My Telegram ops bot has stopped replying. Diagnose it end to end:\n\n1. Check `systemctl status ops-bot` and the last 50 journal lines.\n2. Confirm the BOT_TOKEN in /opt/ops-bot/.env still matches what BotFather shows.\n3. Check outbound connectivity to api.telegram.org from this box.\n4. If the process is crash-looping, show me the exact error and propose a fix —\n   but don't apply it until I confirm.",
    },
    {
      kind: "prompt",
      num: "T2",
      title: "Restarts fail with a permissions error",
      text: "The /restart command replies \"Failed\" with a permissions error. Check that the\n`ops` user's sudoers drop-in covers exactly the whitelisted services, that the\nfile mode is 0440, and that `sudo -l -U ops` lists the three systemctl restart\ncommands. Show me what's wrong before changing anything.",
    },
    {
      kind: "note",
      text: "That's the whole build: a locked-down bot, honest health numbers, guarded restarts, and a service that outlives reboots. The members version adds log tailing, disk alerts that message you first, and a weekly health digest.",
    },
  ],

  "homelab-llm": [
    {
      kind: "p",
      text: "A mini PC with 32 GB of RAM runs an 8B model comfortably and a quantized 14B model acceptably. This build takes you from blank machine to an OpenAI-compatible endpoint on your LAN that any of your tools can use.",
    },
    { kind: "h2", text: "What you need" },
    {
      kind: "p",
      text: "A mini PC or spare desktop with 16 GB of RAM minimum (32 GB recommended), Ubuntu Server 24.04 on it, and a wired network connection.",
    },
    { kind: "h2", text: "1. Install the runtime" },
    {
      kind: "code",
      lang: "bash",
      label: "terminal",
      code: 'curl -fsSL https://ollama.com/install.sh | sh\nollama pull llama3.1:8b\nollama run llama3.1:8b "Say hello in five words."',
    },
    { kind: "h2", text: "2. Open it to your LAN" },
    {
      kind: "p",
      text: "By default the server only listens on localhost. Bind it to the LAN interface and lock it down with a firewall rule so only your subnet can reach it.",
    },
    {
      kind: "code",
      lang: "bash",
      label: "terminal",
      code: 'sudo systemctl edit ollama\n# add:\n# [Service]\n# Environment="OLLAMA_HOST=0.0.0.0:11434"\nsudo systemctl restart ollama\nsudo ufw allow from 192.168.1.0/24 to any port 11434',
    },
    { kind: "h2", text: "3. Talk to it like any API" },
    {
      kind: "code",
      lang: "bash",
      label: "terminal",
      code: 'curl http://192.168.1.50:11434/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -d \'{\n    "model": "llama3.1:8b",\n    "messages": [{"role": "user", "content": "Summarize: the meeting moved to Thursday."}]\n  }\'',
    },
    { kind: "h2", text: "4. Make it survive reboots and updates" },
    {
      kind: "code",
      lang: "bash",
      label: "terminal",
      code: "sudo systemctl enable ollama\n# monthly model updates\ncrontab -e\n# 0 4 1 * * ollama pull llama3.1:8b",
    },
    {
      kind: "note",
      text: "From here you can point the Inbox Zero Agent at this endpoint instead of a paid API. The rest of this build covers quantized 14B models, GPU offload, and putting a reverse proxy with an API key in front.",
    },
  ],

  "desk-mic-assistant": [
    {
      kind: "p",
      text: "A Raspberry Pi 5, a USB microphone, and a button. Hold the button, ask a question, and the assistant answers out loud using your own notes folder as its only source.",
    },
    { kind: "h2", text: "What you need" },
    {
      kind: "p",
      text: "Raspberry Pi 5 with 8 GB of RAM, a USB microphone and speaker, a momentary push button on GPIO 17, and a folder of markdown notes synced to the Pi.",
    },
    { kind: "h2", text: "1. Capture speech on button press" },
    {
      kind: "code",
      lang: "python",
      label: "listen.py",
      code: "import sounddevice as sd\nfrom gpiozero import Button\nimport numpy as np\n\nbutton = Button(17)\nSAMPLE_RATE = 16000\n\ndef record_while_held():\n    frames = []\n    def cb(indata, *_):\n        frames.append(indata.copy())\n    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, callback=cb):\n        button.wait_for_release()\n    return np.concatenate(frames)\n\nbutton.wait_for_press()\naudio = record_while_held()",
    },
    { kind: "h2", text: "2. Transcribe locally" },
    {
      kind: "code",
      lang: "bash",
      label: "terminal",
      code: "pip install faster-whisper\npython -c \"from faster_whisper import WhisperModel; WhisperModel('small')\"",
    },
    {
      kind: "code",
      lang: "python",
      label: "transcribe.py",
      code: 'from faster_whisper import WhisperModel\n\nmodel = WhisperModel("small", compute_type="int8")\n\ndef transcribe(audio):\n    segments, _ = model.transcribe(audio, language="en")\n    return " ".join(s.text for s in segments)',
    },
    { kind: "h2", text: "3. Answer from your notes" },
    {
      kind: "p",
      text: "Embed the notes folder once, retrieve the three closest chunks per question, and pass only those to the model. The assistant cannot make things up about your life if it can only see your notes.",
    },
    {
      kind: "code",
      lang: "python",
      label: "answer.py",
      code: 'import chromadb\nfrom pathlib import Path\n\nclient = chromadb.PersistentClient("./notes-index")\ncol = client.get_or_create_collection("notes")\n\ndef index_notes(folder):\n    for f in Path(folder).glob("**/*.md"):\n        text = f.read_text()\n        for i in range(0, len(text), 800):\n            col.upsert(\n                ids=[f"{f.name}:{i}"],\n                documents=[text[i : i + 800]],\n            )\n\ndef context_for(question):\n    hits = col.query(query_texts=[question], n_results=3)\n    return "\\n---\\n".join(hits["documents"][0])',
    },
    { kind: "h2", text: "4. Speak the answer" },
    {
      kind: "code",
      lang: "bash",
      label: "terminal",
      code: "sudo apt install espeak-ng\npip install piper-tts\npiper --model en_US-lessac-medium --output_file answer.wav",
    },
    {
      kind: "note",
      text: "The full build wires these four pieces into one service with a wake-word fallback, interruption handling, and a nightly re-index of the notes folder.",
    },
  ],
};
