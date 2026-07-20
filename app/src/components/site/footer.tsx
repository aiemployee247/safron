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
      <div className="bg-ink px-4 py-20 text-paper md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tighter md:text-6xl">Shop notes, weekly.</h2>
          <p className="mx-auto mt-4 max-w-xl font-plex text-sm leading-relaxed text-paper/70">
            One working build in your inbox every week. No fluff.
          </p>

          {state === "done" ? (
            <p className="mx-auto mt-8 inline-block border border-paper/30 px-6 py-4 font-plex text-sm text-paper">
              You are on the list. First note lands this week.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mx-auto mt-8 flex max-w-xl border border-paper/40 p-1.5 focus-within:border-cobalt"
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
                className="min-w-0 flex-1 border border-transparent bg-transparent px-4 py-3 font-plex text-sm text-paper placeholder:text-paper/40 focus:border-cobalt focus:outline-none"
              />
              <button
                type="submit"
                disabled={state === "busy"}
                className="shrink-0 bg-paper px-6 py-3 font-plex text-sm font-medium text-ink transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {state === "busy" ? "Adding you" : "Subscribe"}
              </button>
            </form>
          )}
          {state === "error" ? (
            <p className="mt-3 font-plex text-xs text-paper/70">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-ink/10 bg-paper px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-plex text-sm text-ink/70">
            <Link to="/tutorials" className="hover:text-ink">
              Tutorials
            </Link>
            <span aria-hidden="true" className="text-ink/25">
              |
            </span>
            <Link to="/services" className="hover:text-ink">
              Services
            </Link>
            <span aria-hidden="true" className="text-ink/25">
              |
            </span>
            <Link to="/contact" className="hover:text-ink">
              Contact
            </Link>
            <span aria-hidden="true" className="text-ink/25">
              |
            </span>
            <Link to={user ? "/members" : "/sign-in"} className="hover:text-ink">
              {user ? "Members" : "Sign in"}
            </Link>
          </div>
          <div className="flex items-center gap-3 text-ink">
            <HexMark className="h-8 w-8" />
            <span className="font-plex text-xs text-ink/50">Agent Garage</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
