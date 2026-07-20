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
        <h1 className="text-4xl font-bold tracking-tighter text-ink md:text-6xl">
          The tutorial library
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70">
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
              className={`border px-3.5 py-1.5 font-plex text-xs uppercase tracking-wide transition-colors ${
                filter === f
                  ? "border-cobalt bg-cobalt text-paper"
                  : "border-ink/30 text-ink/70 hover:border-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-ink/25">
          {list.map((t) => (
            <TutorialRow key={t.slug} t={t} />
          ))}
        </div>
      </div>
    </main>
  );
}

function TutorialRow({ t }: { t: Tutorial }) {
  return (
    <Link
      to="/tutorials/$slug"
      params={{ slug: t.slug }}
      className="group grid grid-cols-1 items-center gap-6 border-b border-ink/25 py-8 transition-colors hover:bg-paper-deep md:grid-cols-[200px_1fr_auto]"
    >
      <img
        src={t.cover}
        alt={`Technical illustration for ${t.title}`}
        className="w-full max-w-[200px] object-contain"
      />
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex border border-ink/40 px-2 py-0.5 font-plex text-[11px] uppercase tracking-wide text-ink/70">
            {t.track}
          </span>
          {t.gated ? (
            <span className="inline-flex items-center gap-1.5 bg-cobalt px-2 py-0.5 font-plex text-[11px] uppercase tracking-wide text-paper">
              All-Access
            </span>
          ) : (
            <span className="font-plex text-[11px] uppercase tracking-wide text-steel">Open</span>
          )}
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink md:text-3xl">{t.title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">{t.deck}</p>
        <p className="mt-3 font-plex text-xs text-steel">
          {t.minutes} minutes. {t.level}.
        </p>
      </div>
      <svg
        viewBox="0 0 20 12"
        aria-hidden="true"
        className="hidden h-4 w-6 text-cobalt transition-transform duration-300 group-hover:translate-x-1.5 motion-reduce:transition-none md:block"
      >
        <path d="M1 6h16m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </Link>
  );
}
