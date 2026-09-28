import { cities, countryBounds, MAP_HEIGHT, MAP_WIDTH } from "./world-map-data";

export type CityKey = keyof typeof cities;
export type Box = readonly [x: number, y: number, w: number, h: number];

/**
 * Quadratic arc between two cities. `bend` pushes the control point
 * perpendicular to the chord (positive = to the left of travel direction).
 */
function arc(from: CityKey, to: CityKey, bend: number) {
  const a = cities[from];
  const b = cities[to];
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const cx = mx + (-dy / len) * bend * len;
  const cy = my + (dx / len) * bend * len;
  return `M${a.x} ${a.y}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}`;
}

// Oceania routes bow south (over the South Atlantic / Indian Ocean); Canada bows east.
export const ROUTES = {
  AU: arc("brasilia", "canberra", 0.16),
  NZ: arc("brasilia", "wellington", 0.2),
  CA: arc("brasilia", "ottawa", -0.22),
} as const;

export type RouteCode = keyof typeof ROUTES;

/** Grows a box around its centre by `factor` (at least `minW` wide). */
function pad([x, y, w, h]: Box, factor: number, minW = 0): Box {
  const f = Math.max(factor, minW / w);
  return [x + (w - w * f) / 2, y + (h - h * f) / 2, w * f, h * f];
}

function union(...boxes: Box[]): Box {
  const x0 = Math.min(...boxes.map((b) => b[0]));
  const y0 = Math.min(...boxes.map((b) => b[1]));
  const x1 = Math.max(...boxes.map((b) => b[0] + b[2]));
  const y1 = Math.max(...boxes.map((b) => b[1] + b[3]));
  return [x0, y0, x1 - x0, y1 - y0];
}

export const WORLD: Box = [0, 0, MAP_WIDTH, MAP_HEIGHT];

/** Camera framing per story chapter: intro, AU, NZ, CA, then back to the world. */
export const CAMERA: Box[] = [
  pad(countryBounds.BR as unknown as Box, 2.6),
  pad(union(countryBounds.AU as unknown as Box, countryBounds.NZ as unknown as Box), 1.35),
  pad(countryBounds.NZ as unknown as Box, 2.4, 260),
  // Canada, framed so Ottawa sits near the centre (the Arctic is mostly empty chart).
  pad(
    union(countryBounds.CA as unknown as Box, [cities.ottawa.x - 120, cities.ottawa.y, 240, 110]),
    1.1,
  ),
  WORLD,
];

/** Which route is drawn from which chapter on. */
export const ROUTE_CHAPTER: Record<RouteCode, number> = { AU: 1, NZ: 2, CA: 3 };
