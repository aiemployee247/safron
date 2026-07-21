import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { submitContact } from "../lib/api/forms.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact: Agent Garage" },
      {
        name: "description",
        content: "Questions about a tutorial, a service, or your membership. Write in and get a reply within two working days.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agent-garage.higgsfield.app/contact" }],
  }),
  component: ContactPage,
});

const details = [
  {
    icon: "/assets/icons/icon-envelope.png",
    title: "Response time",
    line: "Every message gets a reply within two working days — usually sooner.",
  },
  {
    icon: "/assets/icons/icon-calendar.png",
    title: "Need hands-on help?",
    line: (
      <>
        Stuck build? A{" "}
        <Link to="/services" className="font-semibold text-cobalt hover:text-ink">
          diagnostic call
        </Link>{" "}
        is free — book a session instead of writing in.
      </>
    ),
  },
  {
    icon: "/assets/icons/icon-book.png",
    title: "What to include",
    line: "The build you're on, what you expected, and what happened instead. Error output helps.",
  },
] as const;

function ContactPage() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy");
    try {
      const res = await submitContact({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          message: String(fd.get("message") ?? ""),
        },
      });
      if (res.ok) setState("done");
      else {
        setError(res.error);
        setState("error");
      }
    } catch {
      setError("Something went wrong. Try again.");
      setState("error");
    }
  }

  return (
    <main className="blueprint-grid px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="flex items-center gap-3 font-plex text-xs uppercase tracking-[0.28em] text-cobalt">
          <span className="h-px w-8 bg-cobalt" aria-hidden="true" />
          Contact
        </p>
        <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-tighter text-ink md:text-6xl">
          Write <span className="text-cobalt">in.</span>
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-dim">
          Questions about a build, a service, or your membership. A real person reads every
          message.
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <ul className="space-y-6">
              {details.map((d) => (
                <li key={d.title} className="flex items-start gap-4">
                  <span className="icon-tile h-11 w-11 shrink-0">
                    <img src={d.icon} alt="" className="h-7 w-7 mix-blend-multiply" />
                  </span>
                  <span>
                    <span className="block font-plex text-xs font-semibold uppercase tracking-[0.15em] text-ink">
                      {d.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-dim">
                      {d.line}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10 hidden rounded-2xl border border-line bg-surface/60 p-5 md:block">
              <p className="flex items-center gap-2.5 font-plex text-[10px] uppercase tracking-[0.25em] text-steel">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-signal text-signal glow-dot"
                  aria-hidden="true"
                />
                Inbox status · Open
              </p>
              <p className="mt-2 font-plex text-xs leading-relaxed text-ink-dim">
                Messages land directly on the bench. No ticket queue, no autoresponder.
              </p>
            </div>
          </div>

          <div className="md:col-span-7">
            {state === "done" ? (
              <div className="km-panel p-8 md:p-10">
                <p className="flex items-center gap-2.5 text-lg font-semibold text-ink">
                  <span
                    className="h-2 w-2 rounded-full bg-signal text-signal glow-dot"
                    aria-hidden="true"
                  />
                  Message received.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                  Thanks for writing in. A reply is on its way to your inbox within two working
                  days.
                </p>
              </div>
            ) : (
              <div className="km-panel p-6 md:p-9">
                <h2 className="text-2xl font-bold tracking-tight text-ink">Send a message</h2>
                <p className="mt-2 text-sm text-ink-dim">
                  Fill in the details and it goes straight to the garage.
                </p>
                <form onSubmit={onSubmit} className="mt-7 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="c-name"
                        className="block font-plex text-[10px] uppercase tracking-[0.2em] text-steel"
                      >
                        Your name
                      </label>
                      <input
                        id="c-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="c-email"
                        className="block font-plex text-[10px] uppercase tracking-[0.2em] text-steel"
                      >
                        Email address
                      </label>
                      <input
                        id="c-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink placeholder:text-steel focus:border-cobalt focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="c-message"
                      className="block font-plex text-[10px] uppercase tracking-[0.2em] text-steel"
                    >
                      Message
                    </label>
                    <textarea
                      id="c-message"
                      name="message"
                      rows={6}
                      required
                      placeholder="What are we looking at?"
                      className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-steel focus:border-cobalt focus:outline-none"
                    />
                  </div>
                  {state === "error" ? (
                    <p className="font-plex text-xs text-coral">{error}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={state === "busy"}
                    className="btn-gold w-full px-7 py-3.5 text-base font-semibold disabled:opacity-60"
                  >
                    {state === "busy" ? "Sending" : "Send the message"}
                  </button>
                  <p className="text-center font-plex text-[10px] uppercase tracking-[0.2em] text-steel">
                    Replies within two working days
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
