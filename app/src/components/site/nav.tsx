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
        fontFamily="Outfit, sans-serif"
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
  { to: "/tutorials", label: "Tutorials" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const { user } = useLoaderData({ from: "__root__" });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 text-ink"
          onClick={() => setOpen(false)}
        >
          <span className="transition-transform duration-300 group-hover:rotate-[60deg] motion-reduce:transition-none">
            <HexMark className="h-8 w-8" />
          </span>
          <span className="text-lg font-bold tracking-tight">Agent Garage</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="group relative py-1 text-sm font-medium text-ink/80 hover:text-ink"
            >
              {l.label}
              {/* machinist-rule hairline that slides in under the label */}
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-cobalt transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none" />
            </Link>
          ))}
          {user ? (
            <Link
              to="/members"
              className="group flex items-center gap-2 font-plex text-sm text-ink"
            >
              <span className="transition-transform duration-300 group-hover:rotate-[60deg] motion-reduce:transition-none">
                <HexMark className="h-5 w-5 text-cobalt" />
              </span>
              Members
            </Link>
          ) : (
            <Link
              to="/sign-in"
              className="group flex items-center gap-2 font-plex text-sm text-ink"
            >
              <span className="transition-transform duration-300 group-hover:rotate-[60deg] motion-reduce:transition-none">
                <HexMark className="h-5 w-5 text-cobalt" />
              </span>
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
        <nav className="border-t border-ink/15 bg-paper px-4 pb-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block border-b border-ink/10 py-3 text-base font-medium text-ink"
            >
              {l.label}
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
