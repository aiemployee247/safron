import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { getTutorialContent } from "../lib/api/tutorials.functions";

export const Route = createFileRoute("/tutorials/$slug/install")({
  loader: async ({ params }) => {
    const content = await getTutorialContent({ data: { slug: params.slug } });
    // Only flagship-format tutorials ship an installer.
    if (!content || !content.meta.contents?.length) throw notFound();
    return { meta: content.meta, viewer: content.viewer };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Auto-Installer — ${loaderData?.meta.title ?? "Tutorial"}: Agent Garage` },
      {
        name: "description",
        content: `One-line installer for ${loaderData?.meta.title ?? "this build"}. Copy the command and deploy in minutes.`,
      },
    ],
  }),
  component: InstallPage,
});

function InstallPage() {
  const { meta, viewer } = Route.useLoaderData();
  const command = `curl -fsSL https://agent-garage.higgsfield.app/install/${meta.slug} | bash`;

  return (
    <main className="blueprint-grid px-4 py-14 md:px-6 md:py-20">
      <div className="mx-auto max-w-3xl">
        <nav className="flex flex-wrap items-center gap-4 font-plex text-xs uppercase tracking-wide text-steel">
          <Link
            to="/tutorials/$slug"
            params={{ slug: meta.slug }}
            className="inline-flex items-center gap-2 hover:text-ink"
          >
            <svg viewBox="0 0 20 12" aria-hidden="true" className="h-3 w-4 rotate-180">
              <path d="M1 6h16m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Back to tutorial
          </Link>
          <Link to="/tutorials" className="hover:text-ink">
            Back to library
          </Link>
        </nav>

        <p className="mt-10 flex items-center gap-3 font-plex text-xs uppercase tracking-[0.28em] text-cobalt">
          <span className="h-px w-8 bg-cobalt" aria-hidden="true" />
          Auto installer
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tighter text-ink md:text-5xl">
          Auto-Installer for <span className="text-cobalt">{meta.title.split("—")[0].trim()}</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-dim">
          One-line installer for this build. Copy the command, run it on a fresh Debian/Ubuntu
          server, and it scaffolds the whole project — dependencies, config, and the systemd
          service — in minutes.
        </p>

        {meta.videoId ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-line">
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${meta.videoId}`}
                title={`Setup video: ${meta.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        ) : null}

        <section className="km-panel mt-10 p-6 md:p-9">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-signal/40 bg-signal/10 px-2.5 py-1 font-plex text-[10px] uppercase tracking-[0.25em] text-signal">
              <span className="h-1.5 w-1.5 rounded-full bg-signal text-signal glow-dot" />
              Online installer
            </span>
            <span className="inline-flex items-center rounded-md border border-cobalt/40 bg-cobalt/10 px-2.5 py-1 font-plex text-[10px] uppercase tracking-[0.25em] text-cobalt">
              Members only
            </span>
          </div>

          {viewer.allAccess ? (
            <div className="mt-6">
              <p className="text-sm leading-relaxed text-ink-dim">
                Run this on a fresh Debian/Ubuntu VPS as a sudo-capable user. The script asks
                for your bot token and Telegram user id, then sets up everything the tutorial
                builds by hand.
              </p>
              <CommandBlock command={command} />
              <p className="mt-3 font-plex text-xs text-steel">
                Read any script before you pipe it to bash — this one is short on purpose.{" "}
                <a
                  href={`/install/${meta.slug}`}
                  className="text-cobalt underline underline-offset-4 hover:text-ink"
                >
                  View the source
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-sm leading-relaxed text-ink-dim">
                The one-line installer is available to members only. The script provisions
                services on your server, so we gate it to keep misuse down. Unlock All-Access
                to reveal the command — free while the garage is in beta.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  to={viewer.signedIn ? "/members" : "/sign-up"}
                  className="btn-gold px-6 py-3 text-sm font-semibold"
                >
                  Unlock with membership
                </Link>
                <span className="font-plex text-[10px] uppercase tracking-[0.2em] text-signal">
                  Free during beta
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-plex text-sm font-semibold uppercase tracking-[0.2em] text-ink">
            <span className="text-cobalt">//</span> Explore the full tutorial
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-dim">
            Want the full walkthrough with every prompt, the verification steps, and the
            troubleshooting playbook?
          </p>
          <Link
            to="/tutorials/$slug"
            params={{ slug: meta.slug }}
            className="btn-panel mt-4 inline-block px-5 py-2.5 font-plex text-sm"
          >
            Open full tutorial
          </Link>
        </section>
      </div>
    </main>
  );
}

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <figure className="mt-5 overflow-hidden rounded-xl border border-signal/30 shadow-[0_0_24px_-12px_#00c89c]">
      <figcaption className="flex items-center justify-between border-b border-line bg-panel-hi px-4 py-2">
        <span className="font-plex text-xs text-ink-dim">one-line install</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(command).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            });
          }}
          className="font-plex text-xs text-signal hover:text-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre className="overflow-x-auto bg-surface p-4 font-plex text-[13px] leading-relaxed text-ink">
        <code>{command}</code>
      </pre>
    </figure>
  );
}
