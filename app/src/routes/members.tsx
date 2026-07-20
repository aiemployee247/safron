import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { currentUser, signOut, unlockAllAccess } from "../lib/api/auth.functions";
import {
  billingEnabled,
  hasStripeSubscription,
  openBillingPortal,
  startCheckout,
} from "../lib/api/billing.functions";
import { tutorials } from "../lib/tutorials";

export const Route = createFileRoute("/members")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user) throw redirect({ to: "/sign-in" });
    return { user };
  },
  loader: async ({ context }) => ({
    user: context.user,
    billing: await billingEnabled(),
    hasSubscription: await hasStripeSubscription(),
  }),
  head: () => ({
    meta: [{ title: "Members: Agent Garage" }, { name: "robots", content: "noindex" }],
  }),
  component: MembersPage,
});

function MembersPage() {
  const { user, billing, hasSubscription } = Route.useLoaderData();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const allAccess = user.plan === "all-access";

  // With Stripe configured, "unlock" starts a real paid checkout. Without it
  // (beta), the button flips the plan for free.
  async function onUnlock() {
    setBusy(true);
    setError("");
    try {
      if (billing) {
        const res = await startCheckout();
        if (res.ok) {
          window.location.href = res.url;
          return;
        }
        setError(res.error);
      } else {
        const res = await unlockAllAccess();
        if (res.ok) await router.invalidate();
      }
    } finally {
      setBusy(false);
    }
  }

  async function onManage() {
    setBusy(true);
    setError("");
    try {
      const res = await openBillingPortal();
      if (res.ok) {
        window.location.href = res.url;
        return;
      }
      setError(res.error);
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    await signOut();
    await router.invalidate();
    await router.navigate({ to: "/" });
  }

  return (
    <main className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-plex text-xs font-medium uppercase tracking-[0.2em] text-cobalt">
              Members area
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tighter text-ink md:text-5xl">
              Welcome back, {user.name.split(" ")[0]}.
            </h1>
            <p className="mt-3 font-plex text-sm text-steel">
              {user.email}. Plan:{" "}
              <span className={allAccess ? "text-cobalt" : "text-ink"}>
                {allAccess ? "All-Access" : "Free"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="btn-panel px-4 py-2 font-plex text-xs uppercase tracking-wide text-ink-dim hover:text-ink"
          >
            Sign out
          </button>
        </div>

        {!allAccess ? (
          <button
            type="button"
            onClick={onUnlock}
            disabled={busy}
            className="btn-gold group mt-10 flex w-full items-center justify-between px-6 py-5 text-left transition-transform duration-300 hover:-translate-y-1 disabled:opacity-70 motion-reduce:transition-none md:px-8"
          >
            <span>
              <span className="block text-xl font-semibold tracking-tight md:text-2xl">
                {busy
                  ? billing
                    ? "Opening checkout"
                    : "Unlocking"
                  : billing
                    ? "Unlock All-Access — $10/mo"
                    : "Unlock All-Access"}
              </span>
              <span className="mt-1 block font-plex text-xs text-paper/75">
                {billing
                  ? "Secure checkout via Stripe. Cancel anytime."
                  : "Free while the garage is in beta. One click, the whole library."}
              </span>
            </span>
            <svg viewBox="0 0 20 12" aria-hidden="true" className="h-4 w-6 shrink-0">
              <path d="M1 6h16m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        ) : (
          <div className="mt-10 rounded-2xl border border-signal/40 bg-signal/10 px-6 py-5 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2.5 text-lg font-semibold text-ink">
                  <span className="h-2 w-2 rounded-full bg-signal text-signal glow-dot" aria-hidden="true" />
                  The whole library is open.
                </p>
                <p className="mt-1 font-plex text-xs text-steel">
                  Templates and member Q&A arrive with each new build.
                </p>
              </div>
              {billing && hasSubscription ? (
                <button
                  type="button"
                  onClick={onManage}
                  disabled={busy}
                  className="btn-panel px-4 py-2 font-plex text-xs uppercase tracking-wide disabled:opacity-70"
                >
                  {busy ? "Opening" : "Manage subscription"}
                </button>
              ) : billing ? (
                <span className="font-plex text-[10px] uppercase tracking-[0.2em] text-steel">
                  Beta member · no billing
                </span>
              ) : null}
            </div>
          </div>
        )}
        {error ? <p className="mt-3 font-plex text-xs text-coral">{error}</p> : null}

        <h2 className="mt-16 text-3xl font-bold tracking-tighter text-ink md:text-4xl">
          Your library
        </h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {tutorials.map((t) => {
            const open = !t.gated || allAccess;
            return (
              <Link
                key={t.slug}
                to="/tutorials/$slug"
                params={{ slug: t.slug }}
                className="group flex items-center gap-5 bg-panel p-6 transition-colors hover:bg-panel-hi"
              >
                <img src={t.cover} alt="" className="h-20 w-28 shrink-0 object-contain" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-lg font-bold tracking-tight text-ink">
                      {t.title}
                    </span>
                    {!open ? (
                      <span className="icon-tile h-5 w-5 shrink-0">
                        <img
                          src="/assets/icons/icon-lock.png"
                          alt="Locked"
                          className="h-4 w-4 mix-blend-multiply"
                        />
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block font-plex text-xs text-steel">
                    {t.track}. {t.minutes} minutes.{" "}
                    {open ? "Ready to read." : "Unlock All-Access to read."}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
