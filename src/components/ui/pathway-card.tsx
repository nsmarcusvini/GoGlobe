import Link from "next/link";
import { cn } from "@/lib/cn";
import { SourceBlock } from "./source-block";

export type PathwayCardProps = {
  href: string;
  countryCode: "AU" | "NZ" | "CA";
  officialName: string;
  namePt: string;
  categoryLabel: string;
  summary: string;
  sourceUrl: string;
  verifiedAt: Date | string;
  /** Optional compatibility summary (logged-in results). Never a ranking. */
  summaryCounts?: { meets: number; total: number; hardFails: number; manual: number };
  className?: string;
};

/**
 * Pathway as a chart label: country code + official name in mono (the source's
 * words), Portuguese name as the headline. The whole card is one link target.
 */
export function PathwayCard({
  href,
  countryCode,
  officialName,
  namePt,
  categoryLabel,
  summary,
  sourceUrl,
  verifiedAt,
  summaryCounts,
  className,
}: PathwayCardProps) {
  return (
    <article
      className={cn(
        "group/card relative grid gap-5 rounded-md bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)]",
        "transition-[box-shadow,transform] duration-500 ease-out-expo",
        "hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_var(--line-strong),var(--shadow-lift)]",
        className,
      )}
    >
      <header className="grid gap-3">
        <div className="type-mono flex items-center justify-between gap-3 text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">
              {countryCode}
            </span>
            <span className="truncate">{officialName}</span>
          </span>
          <span className="shrink-0 text-accent">{categoryLabel}</span>
        </div>
        <h3 className="type-title text-[1.625rem]">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {namePt}
          </Link>
        </h3>
      </header>

      <p className="text-ink-muted">{summary}</p>

      {summaryCounts && (
        <dl className="type-mono grid grid-cols-3 gap-px overflow-hidden rounded-sm bg-line">
          <div className="grid gap-1 bg-surface p-3">
            <dt className="text-ink-muted">Atende</dt>
            <dd className="text-lg font-semibold text-ink">
              {summaryCounts.meets}/{summaryCounts.total}
            </dd>
          </div>
          <div className="grid gap-1 bg-surface p-3">
            <dt className="text-ink-muted">Eliminatórios</dt>
            <dd
              className={cn(
                "text-lg font-semibold",
                summaryCounts.hardFails > 0 ? "text-(--status-fails)" : "text-ink",
              )}
            >
              {summaryCounts.hardFails}
            </dd>
          </div>
          <div className="grid gap-1 bg-surface p-3">
            <dt className="text-ink-muted">Verificar</dt>
            <dd className="text-lg font-semibold text-ink">{summaryCounts.manual}</dd>
          </div>
        </dl>
      )}

      <footer className="relative z-10 flex items-end justify-between gap-4 border-t border-line pt-4">
        <SourceBlock url={sourceUrl} verifiedAt={verifiedAt} />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 12"
          className="h-3 w-6 shrink-0 text-route transition-transform duration-500 ease-out-expo group-hover/card:translate-x-1.5"
        >
          <path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </footer>
    </article>
  );
}
