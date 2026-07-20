import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

// The "Browse tutorials" garment: an underline drawn as a blueprint dimension
// line (end ticks included) with the arrow traveling along it on hover.
export function DimensionLink({
  to,
  children,
  className = "",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-baseline gap-2 font-medium ${className}`}
    >
      <span className="relative pb-1.5">
        {children}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-current">
          <span className="absolute -top-[3px] left-0 h-2 w-px bg-current" />
          <span className="absolute -top-[3px] right-0 h-2 w-px bg-current" />
        </span>
      </span>
      <svg
        viewBox="0 0 20 12"
        aria-hidden="true"
        className="h-3 w-5 self-center transition-transform duration-300 group-hover:translate-x-1.5 motion-reduce:transition-none"
      >
        <path
          d="M1 6h16m0 0-5-5m5 5-5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </Link>
  );
}
