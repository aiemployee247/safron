import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { tutorials } from "../lib/tutorials";
import { DimensionLink } from "../components/site/dimension-link";
import { useScrollLift } from "../components/site/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Garage: build AI agents that actually run" },
      {
        name: "description",
        content:
          "Step-by-step tutorials for AI agents, automation, and self-hosting, with copy-paste commands. Plus hands-on help when you want a second pair of hands.",
      },
    ],
    links: [{ rel: "canonical", href: "https://agent-garage.higgsfield.app/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <main>
      <Hero />
      <OnTheBench />
      <Tracks />
      <Services />
      <Membership />
    </main>
  );
}

/* ---------------------------------------------------------------- */
/* Section 1: hero. Image-as-canvas, text bottom-left, and the Tier-1
   grade-shift pair: the cursor is an inspection lamp that lights the
   dormant bench wherever it points. */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Static, fully lit bench: the composed final state.
      el.style.setProperty("--spot", "300vmax");
      return;
    }

    if (window.matchMedia("(pointer: coarse)").matches) {
      // Mobile degradation from the brief: scroll sweeps the lamp down the bench.
      const onScroll = () => {
        const p = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
        el.style.setProperty("--mx", `${55 + p * 15}%`);
        el.style.setProperty("--my", `${25 + p * 55}%`);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    let raf = 0;
    let tx = 62;
    let ty = 42;
    let cx = 62;
    let cy = 42;
    const step = () => {
      raf = 0;
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      el.style.setProperty("--mx", `${cx}%`);
      el.style.setProperty("--my", `${cy}%`);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(step);
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(step);
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-[92dvh] overflow-hidden"
      style={
        {
          "--mx": "62%",
          "--my": "42%",
          "--spot": "34rem",
        } as React.CSSProperties
      }
    >
      <img
        src="/assets/hero-dormant.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-right"
      />
      <img
        src="/assets/hero-lit.png"
        alt="A small robot rover on the Agent Garage workbench under a work lamp"
        className="absolute inset-0 h-full w-full object-cover object-right"
        style={{
          WebkitMaskImage:
            "radial-gradient(circle var(--spot) at var(--mx) var(--my), black 45%, transparent 100%)",
          maskImage:
            "radial-gradient(circle var(--spot) at var(--mx) var(--my), black 45%, transparent 100%)",
        }}
      />
      {/* Paper scrim keeps the text zone readable in every lamp position. */}
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-paper via-paper/70 to-transparent md:w-3/4" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl px-4 pb-16 md:px-6 md:pb-20">
        <h1 className="rise-in max-w-xl text-5xl font-extrabold leading-none tracking-tighter text-ink md:text-7xl">
          Build agents that actually run.
        </h1>
        <p className="rise-in-late mt-5 max-w-md text-base leading-relaxed text-ink/75">
          Step-by-step builds with copy-paste commands. Every tutorial ends with something
          working.
        </p>
        <div className="rise-in-later mt-8 flex flex-wrap items-center gap-6">
          {/* Stamp/press garment: hard ink offset shadow, imprints on press. */}
          <Link
            to="/sign-up"
            className="bg-cobalt px-7 py-3.5 text-base font-semibold text-paper shadow-[5px_5px_0_#14181d] transition-all duration-150 hover:shadow-[7px_7px_0_#14181d] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_#14181d] motion-reduce:transition-none"
          >
            Start learning
          </Link>
          <DimensionLink to="/tutorials" className="text-ink">
            Browse tutorials
          </DimensionLink>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 2: featured tutorials as a gapless bento, hairline ink rules,
   technical-illustration covers. Exactly one cell per tutorial. */

function OnTheBench() {
  const gridRef = useRef<HTMLDivElement>(null);
  useScrollLift(gridRef, 36);
  const [big, second, third, fourth] = tutorials;

  return (
    <section className="blueprint-grid border-t border-ink/15 px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-plex text-xs font-medium uppercase tracking-[0.2em] text-cobalt">
          Tutorials
        </p>
        <h2 className="mt-3 text-4xl font-bold tracking-tighter text-ink md:text-6xl">
          On the bench
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink/70">
          Guides and build notes for people who like to understand every detail.
        </p>

        <div ref={gridRef} className="mt-12 grid border border-ink/25 md:grid-cols-12">
          <BenchCell t={big} className="md:col-span-5 md:row-span-2 md:border-r" large />
          <BenchCell t={second} className="border-t md:col-span-4 md:border-r md:border-t-0" />
          <BenchCell t={fourth} className="border-t md:col-span-3 md:row-span-2 md:border-t-0" tall />
          <BenchCell t={third} className="border-t md:col-span-4 md:border-r" />
        </div>

        <div className="mt-8">
          <DimensionLink
            to="/tutorials"
            className="font-plex text-sm uppercase tracking-wide text-cobalt"
          >
            Browse tutorials
          </DimensionLink>
        </div>
      </div>
    </section>
  );
}

function BenchCell({
  t,
  className = "",
  large = false,
  tall = false,
}: {
  t: (typeof tutorials)[number];
  className?: string;
  large?: boolean;
  tall?: boolean;
}) {
  return (
    <Link
      to="/tutorials/$slug"
      params={{ slug: t.slug }}
      className={`group flex flex-col border-ink/25 bg-paper p-6 transition-colors hover:bg-paper-deep md:p-7 ${className}`}
    >
      <span className="inline-flex w-fit border border-ink/40 px-2 py-0.5 font-plex text-[11px] uppercase tracking-wide text-ink/70">
        {t.track}
      </span>
      <h3
        className={`mt-4 font-bold tracking-tight text-ink ${large ? "text-3xl md:text-4xl" : "text-2xl"}`}
      >
        {t.title}
      </h3>
      <p className="mt-2 font-plex text-xs leading-relaxed text-ink/60">{t.deck}</p>
      <img
        src={t.cover}
        alt={`Technical illustration for ${t.title}`}
        className={`mt-6 w-full object-contain transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none ${
          large ? "max-h-96" : tall ? "max-h-72" : "max-h-44"
        }`}
      />
      <span className="mt-auto pt-5 text-cobalt">
        <svg
          viewBox="0 0 20 12"
          aria-hidden="true"
          className="h-3 w-5 transition-transform duration-300 group-hover:translate-x-1.5 motion-reduce:transition-none"
        >
          <path d="M1 6h16m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    </Link>
  );
}

/* ---------------------------------------------------------------- */
/* Section 3: learning tracks as hover-accordion vertical slices. */

const tracks = [
  {
    key: "agents",
    label: "AI Agents",
    line: "Assistants that read, decide, and act on your behalf.",
    image: "/assets/tutorial-inbox.png",
  },
  {
    key: "automation",
    label: "Automation",
    line: "Systems that handle the busywork while you sleep.",
    image: "/assets/tutorial-telegram.png",
  },
  {
    key: "selfhosting",
    label: "Self-hosting",
    line: "Your models, your hardware, your rules.",
    image: "/assets/tutorial-homelab.png",
  },
] as const;

function Tracks() {
  const [active, setActive] = useState(1);

  return (
    <section className="border-t border-ink/15 px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="mx-auto max-w-xl text-center text-4xl font-bold tracking-tighter text-ink md:text-6xl">
          Three tracks. One garage.
        </h2>

        <div className="mt-14 flex flex-col gap-0 border border-ink/25 md:h-[460px] md:flex-row">
          {tracks.map((tr, i) => {
            const expanded = active === i;
            return (
              <div
                key={tr.key}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`relative overflow-hidden border-ink/25 transition-all duration-500 ease-out motion-reduce:transition-none max-md:border-b max-md:last:border-b-0 md:border-r md:last:border-r-0 ${
                  expanded ? "max-md:min-h-80 md:flex-[3]" : "max-md:min-h-16 md:flex-1"
                }`}
              >
                {expanded ? (
                  <div className="absolute inset-0 bg-cobalt">
                    <img
                      src={tr.image}
                      alt=""
                      className="h-full w-full object-cover opacity-30 mix-blend-luminosity"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                      <h3 className="text-3xl font-extrabold uppercase tracking-tight text-paper md:text-4xl">
                        {tr.label}
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-paper/85">
                        {tr.line}
                      </p>
                      <DimensionLink to="/tutorials" className="mt-4 text-paper">
                        Browse tutorials
                      </DimensionLink>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="flex h-full w-full items-center justify-center p-4 max-md:justify-start"
                    aria-label={`Show the ${tr.label} track`}
                  >
                    <span className="flex items-center gap-3 font-plex text-sm uppercase tracking-[0.2em] text-ink/70 md:rotate-180 md:[writing-mode:vertical-rl]">
                      {tr.label}
                      <span className="h-px w-8 bg-cobalt md:h-8 md:w-px" />
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 4: services as ruled rows with an off-grid heading. */

const serviceRows = [
  {
    name: "Diagnostic call",
    duration: "30 MIN",
    line: "Bring a stuck build. Leave with a diagnosis and the next right move.",
    price: "$0",
    icon: "/assets/icons/icon-calendar.png",
  },
  {
    name: "Build sprint",
    duration: "5 DAYS",
    line: "We build the thing together, end to end, in one focused week.",
    price: "$2,500",
    icon: "/assets/icons/icon-wrench.png",
  },
  {
    name: "Ongoing support",
    duration: "MONTHLY",
    line: "Your systems stay serviced: updates, fixes, and small improvements.",
    price: "$900/mo",
    icon: "/assets/icons/icon-terminal.png",
  },
] as const;

function Services() {
  return (
    <section className="border-t border-ink/15 px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-12">
        <div className="md:col-span-8">
          <h2 className="ml-0 max-w-lg text-4xl font-bold tracking-tighter text-ink md:ml-16 md:text-6xl">
            Bring your build in.
          </h2>
          <div className="mt-10 border-t border-ink/25">
            {serviceRows.map((s) => (
              <Link
                key={s.name}
                to="/services"
                className="group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 border-b border-ink/25 py-6 transition-colors hover:bg-paper-deep md:grid-cols-[40px_1fr_auto_auto] md:gap-x-8"
              >
                <img src={s.icon} alt="" className="h-8 w-8 mix-blend-multiply" />
                <span className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
                  {s.name}
                </span>
                <span className="col-start-2 font-plex text-xs text-steel md:col-start-3">
                  {s.duration}
                </span>
                <span className="col-start-2 text-lg font-semibold text-cobalt md:col-start-4 md:text-xl">
                  {s.price}
                </span>
                <span className="col-span-2 mt-1 max-w-md text-sm leading-relaxed text-ink/65 md:col-span-4">
                  {s.line}
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-4 font-plex text-xs text-steel">No retainers. No surprises.</p>
        </div>

        <div className="flex flex-col gap-6 md:col-span-4">
          <img
            src="/assets/services-hands.png"
            alt="Hands at a workshop keyboard surrounded by precision tools"
            className="w-full object-cover"
          />
          {/* Viewfinder garment: corner brackets close around the label on hover. */}
          <Link
            to="/services"
            className="group relative self-start px-6 py-4 font-plex text-sm uppercase tracking-[0.15em] text-ink"
          >
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cobalt transition-all duration-300 group-hover:h-full group-hover:w-full motion-reduce:transition-none"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cobalt transition-all duration-300 group-hover:h-full group-hover:w-full motion-reduce:transition-none"
            />
            Book a session
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Section 5: membership panels + the cobalt macro crop (the page's one
   material-switch moment). */

function Membership() {
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLift(panelRef, 32);

  return (
    <section className="relative border-t border-ink/15">
      <div className="mx-auto grid max-w-6xl gap-0 md:grid-cols-12">
        <div className="px-4 py-20 md:col-span-9 md:px-6 md:py-28">
          <div className="text-center md:pr-8">
            <p className="font-plex text-xs font-medium uppercase tracking-[0.2em] text-cobalt">
              Membership
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tighter text-ink md:text-6xl">
              The toolbox
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink/70">
              Everything in the garage, for less than a set of hex keys.
            </p>
          </div>

          <div ref={panelRef} className="mt-12 grid gap-10 md:grid-cols-2 md:gap-0">
            <div className="md:border-r md:border-ink/25 md:pr-10">
              <h3 className="text-3xl font-bold tracking-tight text-ink">Free</h3>
              <ul className="mt-6 space-y-4">
                <PerkRow icon="/assets/icons/icon-book.png" text="Open tutorials, start to finish" />
                <PerkRow icon="/assets/icons/icon-envelope.png" text="Shop notes newsletter" />
              </ul>
            </div>
            <div className="md:pl-10">
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-bold tracking-tight text-ink">All-Access</h3>
                <span className="font-plex text-lg text-cobalt">$10/mo</span>
              </div>
              <ul className="mt-6 space-y-4">
                <PerkRow
                  icon="/assets/icons/icon-cap.png"
                  text="Full tutorial library, including member builds"
                />
                <PerkRow
                  icon="/assets/icons/icon-chip.png"
                  text="Project templates and source code"
                />
                <PerkRow
                  icon="/assets/icons/icon-lock.png"
                  text="Member Q&A: ask about your build"
                />
              </ul>
              <p className="mt-5 font-plex text-xs text-steel">
                Free to unlock while the garage is in beta.
              </p>
            </div>
          </div>

          {/* Band garment: the whole strip shifts and the arrow travels. */}
          <Link
            to="/sign-up"
            className="group mt-12 flex items-center justify-between bg-cobalt px-6 py-5 text-paper transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none md:px-8"
          >
            <span className="text-xl font-semibold tracking-tight md:text-2xl">
              Unlock All-Access
            </span>
            <span className="flex items-center gap-3">
              <span className="hidden h-px w-16 bg-paper/60 transition-all duration-300 group-hover:w-24 motion-reduce:transition-none md:block" />
              <svg viewBox="0 0 20 12" aria-hidden="true" className="h-4 w-6">
                <path
                  d="M1 6h16m0 0-5-5m5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
          </Link>
        </div>

        <div className="relative hidden md:col-span-3 md:block">
          <img
            src="/assets/macro-cobalt.png"
            alt="Macro crop of a cobalt anodized precision tool on a machinist ruler"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function PerkRow({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <img src={icon} alt="" className="mt-0.5 h-6 w-6 mix-blend-multiply" />
      <span className="text-base leading-relaxed text-ink/80">{text}</span>
    </li>
  );
}
