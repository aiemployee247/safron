import { Link, useLoaderData } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { subscribeNewsletter } from "../../lib/api/forms.functions";
import { HexMark } from "./nav";

// Section 6 of the home board set: the ink "Shop notes" band + minimal footer
// row. The band renders site-wide as the footer, per board 6.
export function SiteFooter() {
  const { user } = useLoaderData({ from: "__root__" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (!email) return;
    setState("busy");
    try {
      const res = await subscribeNewsletter({ data: { email } });
      if (res.ok) {
        setState("done");
        form.reset();
      } else {
        setError(res.error);
        setState("error");
      }
    } catch {
      setError("Something went wrong. Try again.");
      setState("error");
    }
  }

  return (
    <footer>
      <div className="blueprint-grid border-t border-line/60 px-4 py-20 md:py-28">
        <div className="km-panel mx-auto max-w-3xl px-6 py-12 text-center md:px-12 md:py-16">
          <p className="font-plex text-[10px] uppercase tracking-[0.28em] text-cobalt">
            Transmission · Weekly
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tighter text-ink md:text-6xl">
            Shop notes, weekly.
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-plex text-sm leading-relaxed text-ink-dim">
            One working build in your inbox every week. No fluff.
          </p>

          {state === "done" ? (
            <p className="mx-auto mt-8 inline-block rounded-xl border border-signal/40 bg-signal/10 px-6 py-4 font-plex text-sm text-signal">
              You are on the list. First note lands this week.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mx-auto mt-8 flex max-w-xl gap-2 rounded-2xl border border-line bg-surface p-1.5 focus-within:border-cobalt"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="min-w-0 flex-1 border border-transparent bg-transparent px-4 py-3 font-plex text-sm text-ink placeholder:text-steel focus:outline-none"
              />
              <button
                type="submit"
                disabled={state === "busy"}
                className="btn-gold shrink-0 px-6 py-3 font-plex text-sm font-semibold disabled:opacity-60"
              >
                {state === "busy" ? "Adding you" : "Subscribe"}
              </button>
            </form>
          )}
          {state === "error" ? (
            <p className="mt-3 font-plex text-xs text-coral">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line/60 bg-surface px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6">
          <div className="flex items-center gap-3 text-ink">
            <HexMark className="h-8 w-8 text-cobalt" />
            <span className="font-plex text-sm font-semibold tracking-[0.12em]">
              AGENT <span className="text-cobalt">GARAGE</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-plex text-sm text-ink-dim">
            <Link to="/" className="hover:text-ink">
              Home
            </Link>
            <Link to="/tutorials" className="hover:text-ink">
              Tutorials
            </Link>
            <Link to="/services" className="hover:text-ink">
              Book a Session
            </Link>
            <Link to="/contact" className="hover:text-ink">
              Contact
            </Link>
            <Link to={user ? "/members" : "/sign-in"} className="hover:text-ink">
              {user ? "Members" : "Sign in"}
            </Link>
          </div>
          <p className="font-plex text-[10px] uppercase tracking-[0.25em] text-steel">
            Build agents that actually run
          </p>
        </div>
      </div>
    </footer>
  );
}
