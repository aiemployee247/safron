import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { getTutorialContent } from "../lib/api/tutorials.functions";
import type { TutorialBlock } from "../lib/tutorials";

export const Route = createFileRoute("/tutorials/$slug")({
  loader: async ({ params }) => {
    const content = await getTutorialContent({ data: { slug: params.slug } });
    if (!content) throw notFound();
    return content;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.meta.title ?? "Tutorial"}: Agent Garage` },
      { name: "description", content: loaderData?.meta.deck ?? "" },
    ],
    links: loaderData
      ? [{ rel: "canonical", href: `https://agent-garage.higgsfield.app/tutorials/${loaderData.meta.slug}` }]
      : [],
  }),
  component: TutorialPage,
});

function TutorialPage() {
  const { meta, blocks, locked, lockedReason } = Route.useLoaderData();

  return (
    <main className="px-4 py-16 md:px-6 md:py-24">
      <article className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-md border border-line-hi bg-panel px-2 py-0.5 font-plex text-[11px] uppercase tracking-wide text-ink-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-cobalt" aria-hidden="true" />
            {meta.track}
          </span>
          <span className="font-plex text-[11px] uppercase tracking-wide text-steel">
            {meta.minutes} minutes. {meta.level}.
          </span>
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tighter text-ink md:text-6xl">
          {meta.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-dim">{meta.deck}</p>

        <img
          src={meta.cover}
          alt={`Technical illustration for ${meta.title}`}
          className="blueprint-grid mt-10 w-full rounded-2xl border border-line object-contain"
        />

        <div className="mt-12 space-y-6">
          {blocks.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </div>

        {locked ? <LockPanel reason={lockedReason} /> : null}

        <div className="mt-16 border-t border-line pt-8">
          <Link to="/tutorials" className="font-plex text-sm text-cobalt hover:text-ink">
            All tutorials
          </Link>
        </div>
      </article>
    </main>
  );
}

function Block({ b }: { b: TutorialBlock }) {
  if (b.kind === "h2") {
    return <h2 className="pt-4 text-2xl font-bold tracking-tight text-ink md:text-3xl">{b.text}</h2>;
  }
  if (b.kind === "p") {
    return <p className="max-w-[65ch] text-base leading-relaxed text-ink/80">{b.text}</p>;
  }
  if (b.kind === "note") {
    return (
      <aside className="rounded-r-xl border-l-2 border-cobalt bg-panel px-5 py-4 text-sm leading-relaxed text-ink/80">
        {b.text}
      </aside>
    );
  }
  return <CodeBlock label={b.label} code={b.code} />;
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <figure className="overflow-hidden rounded-xl border border-line">
      <figcaption className="flex items-center justify-between border-b border-line bg-panel-hi px-4 py-2">
        <span className="font-plex text-xs text-ink-dim">{label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            });
          }}
          className="font-plex text-xs text-cobalt hover:text-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre className="overflow-x-auto bg-surface p-4 font-plex text-[13px] leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

function LockPanel({ reason }: { reason: "signin" | "upgrade" | null }) {
  return (
    <div className="relative mt-4">
      <div className="pointer-events-none absolute -top-24 inset-x-0 h-24 bg-gradient-to-b from-transparent to-paper" />
      <div className="km-panel p-8 text-center md:p-12">
        <span className="icon-tile mx-auto h-14 w-14">
          <img
            src="/assets/icons/icon-lock.png"
            alt=""
            className="h-10 w-10 mix-blend-multiply"
          />
        </span>
        <p className="mt-5 inline-flex items-center gap-2 rounded-md border border-cobalt/40 bg-cobalt/10 px-2.5 py-1 font-plex text-[10px] uppercase tracking-[0.25em] text-cobalt">
          Members only
        </p>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink md:text-3xl">
          The rest of this build is in <span className="text-cobalt">the toolbox.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-dim">
          {reason === "upgrade"
            ? "Your account is on the free plan. Unlock All-Access from the members area to keep reading. It is free while the garage is in beta."
            : "Sign in and unlock All-Access to keep reading. It is free while the garage is in beta."}
        </p>
        <div className="mt-8">
          {reason === "upgrade" ? (
            <Link
              to="/members"
              className="btn-gold inline-block px-7 py-3.5 text-base font-semibold"
            >
              Open the members area
            </Link>
          ) : (
            <Link
              to="/sign-in"
              className="btn-gold inline-block px-7 py-3.5 text-base font-semibold"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
