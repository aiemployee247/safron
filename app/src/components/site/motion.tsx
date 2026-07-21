import { useEffect } from "react";

// Lenis smooth scroll bridged to GSAP ScrollTrigger (autoRaf: false + the
// gsap ticker, per the cinema-tier contract). Fully disabled under
// prefers-reduced-motion.
export function MotionRoot() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void Promise.all([
      import("lenis"),
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([{ default: Lenis }, { gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ autoRaf: false });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      cleanup = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}

// Scroll-linked lift for section blocks: transform only (never opacity), so a
// full-page screenshot always shows every section. No-op under reduced motion.
export function useScrollLift(
  ref: React.RefObject<HTMLElement | null>,
  distance = 40,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let killed = false;
    let trigger: { kill: () => void } | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (killed) return;
        gsap.registerPlugin(ScrollTrigger);
        const tween = gsap.from(el, {
          y: distance,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "top 55%",
            scrub: 0.8,
          },
        });
        trigger = tween.scrollTrigger;
      },
    );

    return () => {
      killed = true;
      trigger?.kill();
    };
  }, [ref, distance]);
}
