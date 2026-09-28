import { ui } from "@/content/ui";
import type { PathwayResult, RequirementStatus } from "@/lib/eligibility";

// Rotas sobrepostas: each pathway's requirement track on the same axis, one
// line colour per pathway, so where they diverge is visible at a glance.
// Status is still carried by shape (filled / open / dashed / diamond).

export const TRACK_COLORS = ["var(--route)", "var(--accent)", "var(--ink)"] as const;

function Glyph({ status, color }: { status: RequirementStatus; color: string }) {
  if (status === "manual_check") {
    return (
      <rect
        x={-5}
        y={-5}
        width={10}
        height={10}
        transform="rotate(45)"
        fill="var(--bg)"
        stroke={color}
        strokeWidth={2}
      />
    );
  }
  return (
    <circle
      r={5.5}
      fill={status === "meets" ? color : "var(--bg)"}
      stroke={status === "does_not_meet" ? "var(--status-fails)" : color}
      strokeWidth={2}
      strokeDasharray={status === "insufficient_info" ? "2.5 2" : undefined}
    />
  );
}

export function OverlaidTracks({ results }: { results: PathwayResult[] }) {
  const longest = Math.max(1, ...results.map((r) => r.results.length));
  const width = 1000;
  const step = width / longest;
  const laneGap = 22;
  const height = 40 + laneGap * (results.length - 1);

  return (
    <figure className="grid gap-4">
      <svg
        viewBox={`-20 -20 ${width + 40} ${height + 20}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Requisitos dos caminhos sobrepostos no mesmo eixo"
      >
        {results.map((result, lane) => {
          const color = TRACK_COLORS[lane % TRACK_COLORS.length]!;
          const y = lane * laneGap;
          const end = (result.results.length - 1) * step + step / 2;
          return (
            <g key={result.pathwayId}>
              <line
                x1={step / 2}
                x2={end}
                y1={y}
                y2={y}
                stroke={color}
                strokeWidth={2.5}
                strokeOpacity={0.8}
                vectorEffect="non-scaling-stroke"
              />
              {result.results.map((r, i) => (
                <g key={r.key} transform={`translate(${i * step + step / 2} ${y})`}>
                  <title>{`${result.name}: ${r.label}: ${ui.requirementStatus[r.status].label}`}</title>
                  <Glyph status={r.status} color={color} />
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className="type-mono flex flex-wrap gap-x-6 gap-y-2 text-ink-muted">
        {results.map((result, lane) => (
          <span key={result.pathwayId} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-6"
              style={{ background: TRACK_COLORS[lane % TRACK_COLORS.length] }}
            />
            {result.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
