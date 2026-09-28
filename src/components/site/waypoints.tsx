import Link from "next/link";
import { cn } from "@/lib/cn";

type Waypoint = { href: string; label: string };

/**
 * Links drawn as stops on a vertical route. The solid line covers pages that
 * exist; an optional `pending` stop hangs off a dashed segment (the page being
 * built), so the list reads as "what's already on the map".
 */
export function Waypoints({
  title,
  links,
  pending,
  className,
}: {
  title: string;
  links: readonly Waypoint[];
  pending?: string;
  className?: string;
}) {
  return (
    <nav aria-label={title} className={cn("grid content-start gap-5", className)}>
      <p className="type-eyebrow">{title}</p>
      <ol className="relative">
        {links.map((link, i) => (
          <li key={link.href} className="group relative pl-9">
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-[5px] w-px bg-route",
                i === 0 ? "top-1/2 bottom-0" : "inset-y-0",
                i === links.length - 1 && !pending && "bottom-1/2",
              )}
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-0 size-[11px] -translate-y-1/2 rounded-full border-2 border-route bg-bg transition-colors duration-300 group-hover:bg-route"
            />
            <Link
              href={link.href}
              className="flex items-center justify-between gap-4 border-b border-line py-3.5 text-lg font-semibold transition-colors duration-300 hover:text-green-ink"
            >
              {link.label}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 12"
                className="h-3 w-6 shrink-0 text-ink-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5 group-hover:text-green-ink"
              >
                <path
                  d="M0 6h22M17 1l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </Link>
          </li>
        ))}
        {pending && (
          <li className="relative pt-6 pl-9">
            <span
              aria-hidden="true"
              className="absolute top-0 left-[5px] h-[2.375rem] border-l border-dashed border-route"
            />
            {/* 2.375rem = pt-6 + half of the 1.75rem label line. */}
            <span
              aria-hidden="true"
              className="absolute top-[2.375rem] left-0 size-[11px] -translate-y-1/2 rounded-full border-2 border-ink-muted bg-bg"
            />
            <span className="type-mono flex min-h-7 items-center text-ink-muted">
              {pending} · em construção
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}
