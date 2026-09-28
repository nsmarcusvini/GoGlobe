import { ui } from "@/content/ui";
import { cn } from "@/lib/cn";
import type { RequirementResult, RequirementStatus } from "@/lib/eligibility";

// One dot per requirement, on a line: the status of a whole pathway at a glance.
// Shape carries the status too (never colour alone); eliminatory requirements
// get a ring. The accessible name summarises the counts.

const DOT: Record<RequirementStatus, string> = {
  meets: "bg-(--status-meets) border-(--status-meets)",
  does_not_meet: "bg-bg border-(--status-fails)",
  insufficient_info: "bg-bg border-(--status-info) border-dashed",
  manual_check: "bg-(--status-manual-bg) border-(--status-manual) rotate-45 rounded-[1px]",
};

export function trackSummary(results: RequirementResult[]): string {
  const count = (s: RequirementStatus) => results.filter((r) => r.status === s).length;
  const parts = (["meets", "does_not_meet", "insufficient_info", "manual_check"] as const)
    .map((s) => ({ s, n: count(s) }))
    .filter((p) => p.n > 0)
    .map((p) => `${p.n} ${ui.requirementStatus[p.s].label.toLowerCase()}`);
  return `${results.length} requisitos: ${parts.join(", ")}`;
}

export function RequirementTrack({
  results,
  className,
}: {
  results: RequirementResult[];
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={trackSummary(results)}
      className={cn("relative flex items-center", className)}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
      <ol aria-hidden="true" className="relative flex w-full items-center justify-between gap-1">
        {results.map((r) => (
          <li
            key={r.key}
            title={`${r.label}: ${ui.requirementStatus[r.status].label}`}
            className="grid place-items-center"
          >
            <span
              className={cn(
                "block size-3 border-2",
                r.status === "manual_check" ? "" : "rounded-full",
                DOT[r.status],
                r.isHard &&
                  r.status === "does_not_meet" &&
                  "size-3.5 ring-2 ring-(--status-fails-bg) ring-offset-0",
              )}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Legend for the track (shown once per results page). */
export function TrackLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("type-mono flex flex-wrap gap-x-5 gap-y-2 text-ink-muted", className)}>
      {(["meets", "does_not_meet", "insufficient_info", "manual_check"] as const).map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "block size-3 border-2",
              s === "manual_check" ? "" : "rounded-full",
              DOT[s],
            )}
          />
          {ui.requirementStatus[s].label}
        </li>
      ))}
    </ul>
  );
}
