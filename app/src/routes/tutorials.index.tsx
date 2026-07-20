import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { tutorials, type Tutorial } from "../lib/tutorials";

export const Route = createFileRoute("/tutorials/")({
  head: () => ({
    meta: [
      { title: "Tutorials: Agent Garage" },
      {
        name: "description",
        content:
          "The Agent Garage tutorial library: AI agents, automation, and self-hosting builds with copy-paste commands.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agent-garage.higgsfield.app/tutorials" }],
  }),
  component: TutorialsPage,
});

const filters = ["All", "AI Agents", "Automation", "Self-hosting"] as const;

function TutorialsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const list = tutorials.filter((t) => filter === "All" || t.track === filter);

  return (
    <main className="blueprint-grid px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="flex items-center gap-3 font-plex text-xs uppercase tracking-[0.28em] text-cobalt">
          <span className="h-px w-8 bg-cobalt" aria-hidden="true" />
          Library
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tighter text-ink md:text-6xl">
          The tutorial <span className="text-cobalt">library.</span>
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-dim">
          Every build is tested end to end before it ships. Open builds are free; the rest come
          with All-Access.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-lg border px-3.5 py-1.5 font-plex text-xs uppercase tracking-wide transition-colors ${
                filter === f
                  ? "border-cobalt/60 bg-cobalt text-paper shadow-[0_0_16px_-4px_#eac266]"
                  : "border-line-hi bg-panel text-ink-dim hover:border-steel hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-line">
          {list.map((t, i) => (
            <TutorialRow key={t.slug} t={t} index={i} />
          ))}
        </div>
      </div>
    </main>
  );
}

function TutorialRow({ t, index }: { t: Tutorial; index: number }) {
  return (
    <Link
      to="/tutorials/$slug"
      params={{ slug: t.slug }}
      className="group grid grid-cols-[auto_1fr] items-center gap-6 border-b border-line py-8 transition-colors hover:bg-panel/60 md:grid-cols-[40px_200px_1fr_auto]"
    >
      <span className="self-start pt-1 font-plex text-sm text-steel transition-colors group-hover:text-cobalt">
        {String(index + 1).padStart(2, "0")}
      </span>
      <img
        src={t.cover}
        alt={`Technical illustration for ${t.title}`}
        className="hidden w-full max-w-[200px] rounded-xl border border-line object-contain md:block"
      />
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-plex text-[11px] uppercase tracking-[0.2em] text-cobalt">
            {t.track}
          </span>
          {t.date ? (
            <span className="font-plex text-[11px] uppercase tracking-wide text-steel">
              {t.date}
            </span>
          ) : null}
          {t.gated ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-cobalt/40 bg-cobalt/10 px-2 py-0.5 font-plex text-[11px] uppercase tracking-wide text-cobalt">
              All-Access
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-signal/40 bg-signal/10 px-2 py-0.5 font-plex text-[11px] uppercase tracking-wide text-signal">
              Open
            </span>
          )}
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink transition-colors group-hover:text-cobalt md:text-3xl">
          {t.title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-dim">{t.deck}</p>
        <p className="mt-3 font-plex text-xs text-steel">
          {t.minutes} minutes. {t.level}.
        </p>
      </div>
      <span className="hidden h-11 w-11 place-items-center rounded-full border border-line-hi text-cobalt transition-all duration-300 group-hover:border-cobalt group-hover:bg-cobalt group-hover:text-paper md:grid">
        <svg viewBox="0 0 20 12" aria-hidden="true" className="h-3.5 w-5">
          <path d="M1 6h16m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    </Link>
  );
}
