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
    <main className="blueprint-grid px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-ink md:text-5xl">
            Sign in to unlock the full library.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink/70">
            Your account is how the garage delivers your tutorials, templates, and All-Access
            membership, on any device.
          </p>

          <form onSubmit={onSubmit} className="mt-10 max-w-md space-y-5">
            <div>
              <label
                htmlFor="si-email"
                className="block font-plex text-xs uppercase tracking-wide text-ink/70"
              >
                Email
              </label>
              <input
                id="si-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2 w-full border border-ink/30 bg-paper px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="si-password"
                className="block font-plex text-xs uppercase tracking-wide text-ink/70"
              >
                Password
              </label>
              <input
                id="si-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2 w-full border border-ink/30 bg-paper px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
              />
            </div>
            {error ? <p className="font-plex text-xs text-cobalt">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-cobalt px-7 py-3.5 text-base font-semibold text-paper shadow-[5px_5px_0_#14181d] transition-all duration-150 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_#14181d] disabled:opacity-60 motion-reduce:transition-none"
            >
              {busy ? "Signing in" : "Sign in"}
            </button>
          </form>

          {googleEnabled ? (
            <div className="mt-8 max-w-md">
              <GoogleSignInButton label="Sign in with Google" />
            </div>
          ) : null}

          <p className="mt-6 text-sm text-ink/70">
            No account yet?{" "}
            <Link to="/sign-up" className="font-medium text-cobalt underline underline-offset-4 hover:text-ink">
              Create account
            </Link>
          </p>
        </div>

        <aside className="h-fit border border-ink/25 bg-paper p-8 md:mt-14">
          <p className="font-plex text-xs font-medium uppercase tracking-[0.2em] text-cobalt">
            Membership
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-ink">All-Access</h2>
            <span className="font-plex text-cobalt">$10/mo</span>
          </div>
          <ul className="mt-6 space-y-4">
            <li className="flex items-start gap-3">
              <img src="/assets/icons/icon-cap.png" alt="" className="mt-0.5 h-6 w-6 mix-blend-multiply" />
              <span className="text-sm leading-relaxed text-ink/80">
                Every tutorial in the library, including member builds
              </span>
            </li>
            <li className="flex items-start gap-3">
              <img src="/assets/icons/icon-chip.png" alt="" className="mt-0.5 h-6 w-6 mix-blend-multiply" />
              <span className="text-sm leading-relaxed text-ink/80">
                Project templates and source code
              </span>
            </li>
            <li className="flex items-start gap-3">
              <img src="/assets/icons/icon-envelope.png" alt="" className="mt-0.5 h-6 w-6 mix-blend-multiply" />
              <span className="text-sm leading-relaxed text-ink/80">
                Member Q&A: ask about your own build
              </span>
            </li>
          </ul>
          <p className="mt-6 border-t border-ink/15 pt-4 font-plex text-xs text-steel">
            Free to unlock while the garage is in beta.
          </p>
        </aside>
      </div>
    </main>
  );
}
