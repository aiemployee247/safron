import { createFileRoute } from "@tanstack/react-router";
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
    <main className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24">
      <img
        src="/assets/blueprint-plate.png"
        alt=""
        className="pointer-events-none absolute right-0 top-0 h-72 w-auto opacity-60"
      />
      <div className="relative mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tighter text-ink md:text-6xl">Write in.</h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-dim">
          Questions about a build, a service, or your membership. Replies within two working
          days.
        </p>

        {state === "done" ? (
          <div className="km-panel mt-10 p-8">
            <p className="text-lg font-semibold text-ink">Message received.</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Thanks for writing in. A reply is on its way to your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <div>
              <label
                htmlFor="c-name"
                className="block font-plex text-xs uppercase tracking-wide text-ink/70"
              >
                Your name
              </label>
              <input
                id="c-name"
                name="name"
                type="text"
                required
                className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="c-email"
                className="block font-plex text-xs uppercase tracking-wide text-ink/70"
              >
                Email
              </label>
              <input
                id="c-email"
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="c-message"
                className="block font-plex text-xs uppercase tracking-wide text-ink/70"
              >
                Message
              </label>
              <textarea
                id="c-message"
                name="message"
                rows={6}
                required
                className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
              />
            </div>
            {state === "error" ? <p className="font-plex text-xs text-coral">{error}</p> : null}
            <button
              type="submit"
              disabled={state === "busy"}
              className="group relative h-12 w-full overflow-hidden rounded-xl border border-line-hi bg-panel-hi font-plex text-sm font-medium text-ink disabled:opacity-60"
            >
              <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-full motion-reduce:transition-none">
                {state === "busy" ? "Sending" : "Send the message"}
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-0 flex translate-y-full items-center justify-center bg-cobalt text-paper transition-transform duration-300 group-hover:translate-y-0 motion-reduce:transition-none"
              >
                {state === "busy" ? "Sending" : "Send the message"}
              </span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
