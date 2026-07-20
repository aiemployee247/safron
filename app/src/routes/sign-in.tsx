import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { googleAuthEnabled, signIn } from "../lib/api/auth.functions";
import { GoogleSignInButton } from "../components/site/google-sign-in-button";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>): { error?: string } => ({
    ...(typeof search.error === "string" ? { error: search.error } : {}),
  }),
  loader: async () => ({ googleEnabled: await googleAuthEnabled() }),
  head: () => ({
    meta: [
      { title: "Sign in: Agent Garage" },
      {
        name: "description",
        content: "Sign in to unlock the full Agent Garage tutorial library and your All-Access membership.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agent-garage.higgsfield.app/sign-in" }],
  }),
  component: SignInPage,
});

const benefits = [
  {
    icon: "/assets/icons/icon-cap.png",
    title: "All-Access membership",
    line: "One $10/mo membership unlocks every tutorial in the library, including member builds.",
  },
  {
    icon: "/assets/icons/icon-chip.png",
    title: "Templates & source code",
    line: "Grab any build's project templates and working source the moment you need them.",
  },
  {
    icon: "/assets/icons/icon-envelope.png",
    title: "Member Q&A",
    line: "Every new build we ship is automatically part of your membership. Ask about your own.",
  },
] as const;

function SignInPage() {
  const { googleEnabled } = Route.useLoaderData();
  const { error: searchError } = Route.useSearch();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    searchError === "google"
      ? "Google sign-in didn't complete. Try again, or use your email and password."
      : searchError === "google-unavailable"
        ? "Google sign-in isn't available right now. Use your email and password."
        : "",
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await signIn({
        data: {
          email: String(fd.get("email") ?? ""),
          password: String(fd.get("password") ?? ""),
        },
      });
      if (res.ok) {
        await router.invalidate();
        await router.navigate({ to: "/members" });
      } else {
        setError(res.error);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="blueprint-grid px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-plex text-xs uppercase tracking-wide text-steel hover:text-ink"
        >
          <svg viewBox="0 0 20 12" aria-hidden="true" className="h-3 w-4 rotate-180">
            <path d="M1 6h16m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Back
        </Link>

        <p className="mt-10 flex items-center gap-4">
          <span className="inline-flex items-center rounded-md border border-cobalt/40 bg-cobalt/10 px-2.5 py-1 font-plex text-[10px] uppercase tracking-[0.25em] text-cobalt">
            Members only
          </span>
          <span className="h-px w-12 bg-cobalt/50" aria-hidden="true" />
        </p>

        <h1 className="mt-5 text-4xl font-bold tracking-tighter text-ink md:text-6xl">
          Sign in to unlock <span className="text-cobalt">the full library.</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-dim">
          Your account is how the garage delivers your tutorials, templates, and All-Access
          membership — securely, on any device.
        </p>

        <ul className="mt-10 space-y-6">
          {benefits.map((b) => (
            <li key={b.title} className="flex items-start gap-4">
              <span className="icon-tile h-11 w-11 shrink-0">
                <img src={b.icon} alt="" className="h-7 w-7 mix-blend-multiply" />
              </span>
              <span>
                <span className="block font-plex text-xs font-semibold uppercase tracking-[0.15em] text-ink">
                  {b.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-dim">{b.line}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-8 flex items-start gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3.5 text-sm leading-relaxed text-ink-dim">
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cobalt text-cobalt glow-dot"
            aria-hidden="true"
          />
          <span>
            No account yet?{" "}
            <Link to="/sign-up" className="font-semibold text-cobalt hover:text-ink">
              Create one free
            </Link>{" "}
            — then unlock All-Access from your dashboard, or keep reading the open builds.
          </span>
        </p>

        <div className="km-panel mt-10 p-6 md:p-9">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Sign in</h2>
          <p className="mt-2 text-sm text-ink-dim">Welcome back. Pick a method to continue.</p>

          <div className="mt-7">
            {googleEnabled ? <GoogleSignInButton label="Continue with Google" /> : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="si-email"
                  className="block font-plex text-[10px] uppercase tracking-[0.2em] text-steel"
                >
                  Email address
                </label>
                <input
                  id="si-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink placeholder:text-steel focus:border-cobalt focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="si-password"
                  className="block font-plex text-[10px] uppercase tracking-[0.2em] text-steel"
                >
                  Password
                </label>
                <input
                  id="si-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
                />
              </div>
              {error ? <p className="font-plex text-xs text-coral">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="btn-gold w-full px-7 py-3.5 text-base font-semibold disabled:opacity-60"
              >
                {busy ? "Signing in" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-dim">
              Don&apos;t have an account?{" "}
              <Link to="/sign-up" className="font-semibold text-cobalt hover:text-ink">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center font-plex text-xs text-steel">
          Curious first?{" "}
          <Link
            to="/tutorials"
            className="text-ink-dim underline underline-offset-4 hover:text-cobalt"
          >
            See what All-Access includes
          </Link>{" "}
          →
        </p>
      </div>
    </main>
  );
}
