import { ui } from "@/content/ui";
import { cn } from "@/lib/cn";
import type { RequirementStatus } from "@/lib/eligibility";

const tone: Record<RequirementStatus, string> = {
  meets: "text-(--status-meets) bg-(--status-meets-bg)",
  does_not_meet: "text-(--status-fails) bg-(--status-fails-bg)",
  insufficient_info: "text-(--status-info) bg-(--status-info-bg)",
  manual_check: "text-(--status-manual) bg-(--status-manual-bg)",
};

/** Shape carries meaning too, so status never depends on colour alone. */
function Glyph({ status }: { status: RequirementStatus }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0">
      {status === "meets" && (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M4.5 8.2l2.3 2.3 4.7-4.9" stroke="var(--bg)" strokeWidth="1.8" fill="none" />
        </>
      )}
      {status === "does_not_meet" && (
        <>
          <circle cx="8" cy="8" r="6.2" {...common} />
          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" {...common} />
        </>
      )}
      {status === "insufficient_info" && (
        <>
          <circle cx="8" cy="8" r="6.2" {...common} strokeDasharray="2.4 2" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" />
        </>
      )}
      {status === "manual_check" && (
        <>
          <path d="M8 1.5l6.5 6.5L8 14.5 1.5 8z" {...common} />
          <path d="M8 5v3.6M8 10.6v.4" {...common} />
        </>
      )}
    </svg>
  );
}

export function StatusBadge({
  status,
  showHint = false,
  className,
}: {
  status: RequirementStatus;
  showHint?: boolean;
  className?: string;
}) {
  const text = ui.requirementStatus[status];
  return (
    <span
      className={cn(
        "type-mono inline-flex items-center gap-1.5 rounded-xs px-2 py-1 leading-none",
        tone[status],
        className,
      )}
    >
      <Glyph status={status} />
      <span className="font-semibold">{text.label}</span>
      {showHint && <span className="font-normal opacity-80">· {text.hint}</span>}
    </span>
  );
}
