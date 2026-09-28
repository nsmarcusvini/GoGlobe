import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { ROUTES, type RouteCode } from "./routes";
import { cities, countryBounds, countryPaths, MAP_HEIGHT, MAP_WIDTH } from "./world-map-data";

// Static journey map (Carta de Bordo): the Phase 2 chart, cropped to the routes
// that matter to this person. No JS: pure SVG + CSS. Routes draw once on load;
// `progress` (0..1) fills a route like a checklist fills.

const CAPITAL: Record<RouteCode, keyof typeof cities> = {
  AU: "canberra",
  NZ: "wellington",
  CA: "ottawa",
};

export type JourneyRoute = {
  code: RouteCode;
  /** 0..1. Omit for a fully drawn route. */
  progress?: number;
  /** Extra label next to the capital, e.g. "4 de 12". */
  caption?: string;
};

type Box = [number, number, number, number];

function frame(routes: JourneyRoute[]): Box {
  const points: Array<[number, number]> = [[cities.brasilia.x, cities.brasilia.y]];
  const boxes = routes.map((r) => countryBounds[r.code] as unknown as Box);
  boxes.push(countryBounds.BR as unknown as Box);
  for (const r of routes) points.push([cities[CAPITAL[r.code]].x, cities[CAPITAL[r.code]].y]);
  for (const [x, y, w, h] of boxes) points.push([x, y], [x + w, y + h]);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const padX = (x1 - x0) * 0.08 + 30;
  const padY = (y1 - y0) * 0.12 + 30;
  x0 = Math.max(0, x0 - padX);
  // Labels of left-side cities (Ottawa, Brasília) extend to the right.
  x1 = Math.min(MAP_WIDTH, x1 + padX + 60);
  y0 = Math.max(0, y0 - padY);
  y1 = Math.min(MAP_HEIGHT, y1 + padY);
  return [x0, y0, x1 - x0, y1 - y0];
}

export function JourneyMap({
  routes,
  className,
  label,
}: {
  routes: JourneyRoute[];
  className?: string;
  /** Accessible summary; the map itself is decorative. */
  label?: string;
}) {
  const shown = routes.length ? routes : [];
  const [bx, by, bw, bh] = frame(shown);
  const lit = new Set<string>(["BR", ...shown.map((r) => r.code)]);
  const pct = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <figure
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: `${bw} / ${bh}` }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div
        className="absolute"
        style={{
          width: pct(MAP_WIDTH, bw),
          left: `-${(bx / bw) * 100}%`,
          top: `-${(by / bh) * 100}%`,
          aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}`,
        }}
      >
        <div className="map-layer map-grid" />
        <div className="map-layer map-land" />
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="absolute inset-0 size-full overflow-visible"
        >
          {(Object.keys(countryPaths) as Array<keyof typeof countryPaths>).map((code) => (
            <path
              key={code}
              d={countryPaths[code]}
              style={{ fill: lit.has(code) ? "var(--map-country-active)" : "var(--map-country)" }}
            />
          ))}
          {shown.map((route, i) => {
            const progress =
              route.progress === undefined ? 1 : Math.max(0, Math.min(1, route.progress));
            return (
              <g key={route.code}>
                <path
                  d={ROUTES[route.code]}
                  fill="none"
                  stroke="var(--route)"
                  strokeOpacity={0.4}
                  strokeWidth={1.25}
                  strokeDasharray="4 6"
                  vectorEffect="non-scaling-stroke"
                />
                {progress > 0 && (
                  <path
                    d={ROUTES[route.code]}
                    fill="none"
                    stroke="var(--route)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={`${progress} 1`}
                    vectorEffect="non-scaling-stroke"
                    className="journey-route"
                    style={
                      { animationDelay: `${300 + i * 180}ms`, "--p": progress } as CSSProperties
                    }
                  />
                )}
              </g>
            );
          })}
        </svg>

        {[
          { key: "brasilia" as const, caption: undefined as string | undefined, reached: true },
          ...shown.map((r) => ({
            key: CAPITAL[r.code],
            caption: r.caption,
            reached: (r.progress ?? 1) >= 1,
          })),
        ].map(({ key, caption, reached }) => {
          const city = cities[key];
          // Oceania sits on the right edge and its two capitals are close:
          // label them on the left, Canberra above and Wellington below.
          const onLeft = key === "canberra" || key === "wellington";
          return (
            <div
              key={key}
              className={cn(
                "absolute flex -translate-y-1/2 items-center gap-2",
                onLeft ? "translate-x-[calc(-100%+6px)] flex-row-reverse" : "-translate-x-[6px]",
              )}
              style={{ left: pct(city.x, MAP_WIDTH), top: pct(city.y, MAP_HEIGHT) }}
            >
              <span
                className={cn(
                  "size-3 shrink-0 rounded-full border-2 border-route",
                  reached ? "bg-route" : "bg-bg",
                )}
              />
              <span
                className={cn(
                  "type-mono rounded-xs bg-bg/85 px-1.5 py-0.5 whitespace-nowrap text-ink backdrop-blur-sm",
                  key === "canberra" && "-translate-y-[70%]",
                  key === "wellington" && "translate-y-[70%]",
                )}
              >
                {city.label}
                {caption && <span className="text-ink-muted"> · {caption}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
