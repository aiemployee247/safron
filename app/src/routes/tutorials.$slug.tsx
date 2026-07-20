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
  const { meta, blocks, locked, lockedReason, viewer } = Route.useLoaderData();
  const flagship = Boolean(meta.contents?.length);
  const promptCount = blocks.filter((b) => b.kind === "prompt").length;

  return (
    <main className="px-4 py-14 md:px-6 md:py-20">
      <article className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 font-plex text-xs text-steel">
          <Link to="/" className="hover:text-ink">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/tutorials" className="hover:text-ink">
            Tutorials
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink-dim">{meta.title.split("—")[0].trim()}</span>
        </nav>

        <p className="mt-8 flex items-center gap-3 font-plex text-xs uppercase tracking-[0.28em] text-cobalt">
          <span className="h-px w-8 bg-cobalt" aria-hidden="true" />
          {meta.track} // build
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tighter text-ink md:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-dim">{meta.deck}</p>

        {/* Stats + badges + share */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {meta.builders ? (
            <span className="rounded-lg border border-line bg-panel px-3 py-1.5 text-center">
              <span className="block font-plex text-sm font-semibold text-ink">
                {meta.builders}
              </span>
              <span className="block font-plex text-[9px] uppercase tracking-[0.2em] text-steel">
                Builders viewed
              </span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2 rounded-md border border-line-hi bg-panel px-2.5 py-1 font-plex text-[11px] uppercase tracking-wide text-ink-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-cobalt" aria-hidden="true" />
            Prompts &amp; commands
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-line-hi bg-panel px-2.5 py-1 font-plex text-[11px] uppercase tracking-wide text-ink-dim">
            {meta.minutes} min · {meta.level}
          </span>
          {flagship ? (
            <Link
              to="/tutorials/$slug/install"
              params={{ slug: meta.slug }}
              className="inline-flex items-center gap-2 rounded-md border border-signal/40 bg-signal/10 px-2.5 py-1 font-plex text-[11px] uppercase tracking-wide text-signal hover:border-signal"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-signal text-signal glow-dot" />
              Auto-installer
            </Link>
          ) : null}
          {meta.date ? (
            <span className="font-plex text-[11px] uppercase tracking-wide text-steel">
              {meta.date}
            </span>
          ) : null}
          <ShareButton />
        </div>

        {/* Usage & license */}
        {flagship ? (
          <div className="mt-8 rounded-2xl border border-line bg-surface/60 p-5">
            <p className="font-plex text-[10px] uppercase tracking-[0.25em] text-cobalt">
              Usage &amp; license
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              Use the prompts and commands in this build in your own personal and commercial
              projects. Please don&apos;t resell, repackage, or republish the tutorial itself —
              send people to Agent Garage instead.
            </p>
          </div>
        ) : null}

        {/* Video walkthrough */}
        {meta.videoId ? (
          <section className="mt-10">
            <p className="flex items-center gap-3 font-plex text-xs uppercase tracking-[0.28em] text-cobalt">
              <span className="h-px w-8 bg-cobalt" aria-hidden="true" />
              Watch the full tutorial
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line">
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${meta.videoId}`}
                  title={`Video walkthrough: ${meta.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>
          </section>
        ) : (
          <img
            src={meta.cover}
            alt={`Technical illustration for ${meta.title}`}
            className="blueprint-grid mt-10 w-full rounded-2xl border border-line object-contain"
          />
        )}

        {/* Contents */}
        {meta.contents?.length ? (
          <section className="km-panel mt-10 p-6 md:p-8">
            <h2 className="font-plex text-sm font-semibold uppercase tracking-[0.2em] text-ink">
              <span className="text-cobalt">//</span> Contents
            </h2>
            <div className="mt-5 space-y-6">
              {meta.contents.map((c) => (
                <div key={c.part}>
                  <p className="font-plex text-[11px] uppercase tracking-[0.18em] text-cobalt">
                    {c.part}
                  </p>
                  <ol className="mt-3 space-y-2">
                    {c.steps.map((s, i) => (
                      <li key={s} className="flex items-baseline gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line-hi bg-surface font-plex text-[10px] text-ink-dim">
                          {i + 1}
                        </span>
                        <span className="text-sm text-ink/85">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Prerequisites */}
        {meta.prereqs?.length ? (
          <section className="mt-8 rounded-2xl border border-line bg-surface/60 p-6 md:p-8">
            <p className="font-plex text-[10px] uppercase tracking-[0.25em] text-steel">
              What you&apos;ll need
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Prerequisites</h2>
            <ul className="mt-4 space-y-2.5">
              {meta.prereqs.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-ink-dim">
                  <span className="mt-0.5 font-plex text-cobalt" aria-hidden="true">
                    ▸
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Downloads + membership pitch */}
        {flagship ? (
          <section className="km-panel mt-8 p-6 md:p-8">
            <h2 className="text-xl font-bold tracking-tight text-ink">Unlock the downloads</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              All {promptCount} prompts as one .md file, plus the one-line auto-installer.
              All-Access unlocks every tutorial, template, and download on the platform —
              free while the garage is in beta.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              {viewer.allAccess ? (
                <>
                  <a
                    href={`/tutorials/${meta.slug}/prompts.md`}
                    className="btn-gold px-6 py-3 text-sm font-semibold"
                  >
                    Download all prompts (.md)
                  </a>
                  <Link
                    to="/tutorials/$slug/install"
                    params={{ slug: meta.slug }}
                    className="btn-panel px-5 py-3 text-sm font-medium"
                  >
                    Open the auto-installer
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={viewer.signedIn ? "/members" : "/sign-up"}
                    className="btn-gold px-6 py-3 text-sm font-semibold"
                  >
                    Unlock All-Access — $10/mo
                  </Link>
                  <span className="font-plex text-[10px] uppercase tracking-[0.2em] text-signal">
                    Free during beta
                  </span>
                </>
              )}
              <Link
                to="/services"
                className="font-plex text-xs text-ink-dim underline underline-offset-4 hover:text-cobalt"
              >
                Or have us deploy this for you →
              </Link>
            </div>
          </section>
        ) : null}

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

function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(window.location.href).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="btn-panel px-3 py-1.5 font-plex text-[11px] uppercase tracking-wide"
    >
      {copied ? "Link copied" : "Share"}
    </button>
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
  if (b.kind === "part") {
    return (
      <section className="pt-8">
        <p className="font-plex text-xs uppercase tracking-[0.28em] text-cobalt">
          Part {String(b.num).padStart(2, "0")} / {String(b.total).padStart(2, "0")}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink md:text-3xl">{b.title}</h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-dim">{b.blurb}</p>
        <div className="hairline mt-6" />
      </section>
    );
  }
  if (b.kind === "prompt") {
    return <PromptCard num={b.num} title={b.title} text={b.text} />;
  }
  if (b.kind === "image") {
    return (
      <figure>
        <img
          src={b.src}
          alt={b.caption}
          className="w-full rounded-2xl border border-line object-contain"
        />
        <figcaption className="mt-2 font-plex text-xs text-steel">{b.caption}</figcaption>
      </figure>
    );
  }
  if (b.kind === "video") {
    return (
      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${b.youtubeId}`}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>
    );
  }
  return <CodeBlock label={b.label} code={b.code} />;
}

function PromptCard({ num, title, text }: { num: string; title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <figure className="overflow-hidden rounded-xl border border-cobalt/30 shadow-[0_0_24px_-12px_#eac266]">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line bg-panel-hi px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 rounded-md border border-cobalt/40 bg-cobalt/10 px-2 py-0.5 font-plex text-[10px] font-semibold uppercase tracking-[0.15em] text-cobalt">
            Prompt {num}
          </span>
          <span className="truncate font-plex text-xs text-ink">{title}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            });
          }}
          className="shrink-0 font-plex text-xs text-cobalt hover:text-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre className="overflow-x-auto whitespace-pre-wrap bg-surface p-4 font-plex text-[13px] leading-relaxed text-ink">
        <code>{text}</code>
      </pre>
    </figure>
  );
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
          Keep building with <span className="text-cobalt">the full set.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-dim">
          {reason === "upgrade"
            ? "You've just walked through the free preview. The rest of the build lives in All-Access — unlock it from the members area. It is free while the garage is in beta."
            : "You've just walked through the free preview. Sign in and unlock All-Access to keep reading — it is free while the garage is in beta."}
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
