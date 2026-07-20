import type { TutorialBlock } from "./tutorials";

// Server-only lesson content, keyed by tutorial slug. Never import this from
// client components; it is served through getTutorialContent, which trims
// gated tutorials to a preview for non-members.
export const tutorialBlocks: Record<string, TutorialBlock[]> = {
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
