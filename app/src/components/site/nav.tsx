import { Link, useLoaderData } from "@tanstack/react-router";
import { useState } from "react";

// Hex-nut AG monogram (invented brand, inline SVG mark). The glyph rotates a
// sixth of a turn on hover, like a nut taking a wrench.
export function HexMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <polygon
        points="24,3 42,13.5 42,34.5 24,45 6,34.5 6,13.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontFamily="'Work Sans', sans-serif"
        fontWeight="700"
        fontSize="17"
        fill="currentColor"
      >
        AG
      </text>
    </svg>
  );
}

const links = [
  { to: "/tutorials", label: "Tutorials", code: "TUT" },
  { to: "/services", label: "Services", code: "SVC" },
  { to: "/contact", label: "Contact", code: "CON" },
] as const;

export function SiteNav() {
  const { user } = useLoaderData({ from: "__root__" });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          to="/"
          className="group flex items-center gap-3 text-ink"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-cobalt/40 bg-surface shadow-[0_8px_24px_-10px_#eac266] transition-transform duration-300 group-hover:rotate-[60deg] motion-reduce:transition-none">
            <HexMark className="h-6 w-6 text-cobalt" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-plex text-[14px] font-semibold tracking-tight">
              AGENT GARAGE
            </span>
            <span className="block font-plex text-[9px] tracking-[0.28em] text-cobalt/80">
              BUILD · CTRL
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="group relative flex items-center gap-2.5 py-1 text-sm font-medium text-ink-dim hover:text-ink"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-line-hi transition-all group-hover:bg-cobalt group-hover:glow-dot group-hover:text-cobalt" />
              {l.label}
              <span className="font-plex text-[9px] tracking-widest text-steel">{l.code}</span>
            </Link>
          ))}
          {user ? (
            <Link
              to="/members"
              className="btn-panel flex items-center gap-2 px-4 py-2 font-plex text-xs uppercase tracking-wide"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-signal text-signal glow-dot" />
              Members
            </Link>
          ) : (
            <Link
              to="/sign-in"
              className="btn-gold flex items-center gap-2 px-4 py-2 font-plex text-xs font-semibold uppercase tracking-wide"
            >
              Sign in
            </Link>
          )}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`h-0.5 w-6 bg-ink transition-transform ${open ? "translate-y-1 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-ink transition-transform ${open ? "-translate-y-1 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open ? (
        <nav className="border-t border-line/60 bg-paper px-4 pb-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-line/60 py-3 text-base font-medium text-ink"
            >
              {l.label}
              <span className="font-plex text-[9px] tracking-widest text-steel">{l.code}</span>
            </Link>
          ))}
          <Link
            to={user ? "/members" : "/sign-in"}
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center gap-2 py-2 font-plex text-sm text-cobalt"
          >
            <HexMark className="h-5 w-5" />
            {user ? "Members" : "Sign in"}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
