"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type RailStop = { href: string; label: string; done: boolean; match: string };

/**
 * The person's journey as stops on a route: vertical rail on desktop, a
 * horizontal strip on mobile. Done stops are filled; the current one is marked.
 */
export function JourneyRail({ stops }: { stops: RailStop[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Sua jornada">
      <ol className="relative flex gap-1 overflow-x-auto lg:grid lg:gap-0 lg:overflow-visible">
        <span
          aria-hidden="true"
          className="absolute top-[1.1rem] right-4 left-4 h-px bg-line-strong lg:top-4 lg:right-auto lg:bottom-4 lg:left-[5px] lg:h-auto lg:w-px"
        />
        {stops.map((stop, i) => {
          const current = pathname === stop.match || pathname.startsWith(`${stop.match}/`);
          return (
            <li key={stop.href} className="relative shrink-0">
              <Link
                href={stop.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-sm px-2 py-2 transition-colors duration-300 lg:py-3 lg:pr-4 lg:pl-0",
                  current ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative z-10 grid size-3 place-items-center rounded-full border-2 transition-colors duration-500",
                    stop.done ? "border-route bg-route" : "border-line-strong bg-bg",
                    current && "ring-4 ring-(--status-meets-bg)",
                  )}
                />
                <span className="flex items-baseline gap-2">
                  <span className="type-mono hidden text-ink-muted lg:inline">0{i + 1}</span>
                  <span
                    className={cn("text-[0.9375rem]", current ? "font-semibold" : "font-medium")}
                  >
                    {stop.label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
