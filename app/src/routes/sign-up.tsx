import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { googleAuthEnabled, signUp } from "../lib/api/auth.functions";
import { GoogleSignInButton } from "../components/site/google-sign-in-button";

export const Route = createFileRoute("/sign-up")({
  loader: async () => ({ googleEnabled: await googleAuthEnabled() }),
  head: () => ({
    meta: [
      { title: "Create account: Agent Garage" },
      {
        name: "description",
        content: "Create your Agent Garage account and start building agents that actually run.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agent-garage.higgsfield.app/sign-up" }],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { googleEnabled } = Route.useLoaderData();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await signUp({
        data: {
          name: String(fd.get("name") ?? ""),
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
            Free account
          </span>
          <span className="h-px w-12 bg-cobalt/50" aria-hidden="true" />
        </p>

        <h1 className="mt-5 text-4xl font-bold tracking-tighter text-ink md:text-6xl">
          Get a bench in <span className="text-cobalt">the garage.</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-ink-dim">
          A free account opens the open tutorials and the shop notes. All-Access unlocks the
          rest.
        </p>

        <div className="km-panel mt-10 p-6 md:p-9">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Create account</h2>
          <p className="mt-2 text-sm text-ink-dim">Pick a method to get started.</p>

          <div className="mt-7">
            {googleEnabled ? <GoogleSignInButton label="Continue with Google" /> : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="su-name"
                  className="block font-plex text-[10px] uppercase tracking-[0.2em] text-steel"
                >
                  Your name
                </label>
                <input
                  id="su-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="su-email"
                  className="block font-plex text-[10px] uppercase tracking-[0.2em] text-steel"
                >
                  Email address
                </label>
                <input
                  id="su-email"
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
                  htmlFor="su-password"
                  className="block font-plex text-[10px] uppercase tracking-[0.2em] text-steel"
                >
                  Password
                </label>
                <input
                  id="su-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="mt-2 w-full rounded-lg border border-line-hi bg-surface px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
                />
                <p className="mt-2 font-plex text-xs text-steel">At least 8 characters.</p>
              </div>
              {error ? <p className="font-plex text-xs text-coral">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="btn-gold w-full px-7 py-3.5 text-base font-semibold disabled:opacity-60"
              >
                {busy ? "Setting up your bench" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-dim">
              Already have an account?{" "}
              <Link to="/sign-in" className="font-semibold text-cobalt hover:text-ink">
                Sign in
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
