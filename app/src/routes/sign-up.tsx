import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { signUp } from "../lib/api/auth.functions";

export const Route = createFileRoute("/sign-up")({
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
    <main className="blueprint-grid px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="text-4xl font-bold tracking-tighter text-ink md:text-5xl">
          Get a bench in the garage.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink/70">
          A free account opens the open tutorials and the shop notes. All-Access unlocks the
          rest.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div>
            <label
              htmlFor="su-name"
              className="block font-plex text-xs uppercase tracking-wide text-ink/70"
            >
              Your name
            </label>
            <input
              id="su-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="mt-2 w-full border border-ink/30 bg-paper px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="su-email"
              className="block font-plex text-xs uppercase tracking-wide text-ink/70"
            >
              Email
            </label>
            <input
              id="su-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-2 w-full border border-ink/30 bg-paper px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="su-password"
              className="block font-plex text-xs uppercase tracking-wide text-ink/70"
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
              className="mt-2 w-full border border-ink/30 bg-paper px-4 py-3 text-sm text-ink focus:border-cobalt focus:outline-none"
            />
            <p className="mt-2 font-plex text-xs text-steel">At least 8 characters.</p>
          </div>
          {error ? <p className="font-plex text-xs text-cobalt">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-cobalt px-7 py-3.5 text-base font-semibold text-paper shadow-[5px_5px_0_#14181d] transition-all duration-150 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_#14181d] disabled:opacity-60 motion-reduce:transition-none"
          >
            {busy ? "Setting up your bench" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink/70">
          Already have an account?{" "}
          <Link to="/sign-in" className="font-medium text-cobalt underline underline-offset-4 hover:text-ink">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
