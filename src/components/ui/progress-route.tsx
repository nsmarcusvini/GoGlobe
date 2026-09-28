import { ui } from "@/content/ui";
import { cn } from "@/lib/cn";

/**
 * Progress drawn as a route: a line with waypoints. Used by onboarding steps and
 * checklists. `steps` renders discrete waypoints; omit it for a continuous bar.
 */
export function ProgressRoute({
  value,
  max,
  steps,
  label = ui.progress.label,
  className,
}: {
  value: number;
  max: number;
  steps?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const pct = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="type-mono flex items-baseline justify-between text-ink-muted">
        <span>{label}</span>
        <span className="text-ink">
          {clamped} {ui.progress.of} {max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        className="relative h-3"
      >
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
        <div
          className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-route transition-[width] duration-700 ease-out-expo"
          style={{ width: `${pct}%` }}
        />
        {steps &&
          Array.from({ length: steps + 1 }, (_, i) => {
            const at = (i / steps) * 100;
            const reached = at <= pct + 0.001;
            return (
              <span
                key={i}
                aria-hidden="true"
                className={cn(
                  "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-500",
                  reached ? "border-route bg-route" : "border-line-strong bg-bg",
                )}
                style={{ left: `${at}%` }}
              />
            );
          })}
      </div>
    </div>
  );
}
