"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CAMERA, ROUTE_CHAPTER, ROUTES, type Box, type RouteCode } from "./routes";
import { cities, countryPaths, MAP_HEIGHT, MAP_WIDTH } from "./world-map-data";

export type StoryChapter = {
  /** Mono label shown in the map HUD while the chapter is active. */
  hud: string;
  content: ReactNode;
};

type Size = { w: number; h: number };

/** Transform that frames `box` (map units) inside a frame of `size` px. */
function camera(box: Box, size: Size) {
  const u = size.w / MAP_WIDTH;
  const [bx, by, bw, bh] = box;
  const s = Math.min(4, (0.86 * size.w) / (bw * u), (0.78 * size.h) / (bh * u));
  const tx = size.w / 2 - s * (bx + bw / 2) * u;
  const ty = size.h / 2 - s * (by + bh / 2) * u;
  return { s, u, transform: `translate3d(${tx}px, ${ty}px, 0) scale(${s})` };
}

const CITY_CHAPTER: Record<keyof typeof cities, number> = {
  brasilia: 0,
  canberra: 1,
  wellington: 2,
  ottawa: 3,
};

/**
 * Sticky map whose camera flies to each country while the chapters scroll past.
 * Routes draw themselves when their chapter becomes active and stay drawn.
 * The map is decorative (aria-hidden); every fact lives in the chapter text.
 */
export function RouteStory({ chapters }: { chapters: StoryChapter[] }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const [size, setSize] = useState<Size | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.chapter));
          }
        }
      },
      // Desktop: map beside the text, trigger at mid-screen. Mobile: the map covers the
      // top half, so trigger in the middle of the visible lower half.
      {
        rootMargin: window.matchMedia("(min-width: 1024px)").matches
          ? "-48% 0px -48% 0px"
          : "-74% 0px -24% 0px",
      },
    );
    for (const el of chapterRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [chapters.length]);

  const box = CAMERA[Math.min(active, CAMERA.length - 1)] ?? CAMERA[0]!;
  const cam = size ? camera(box, size) : null;
  // One screen pixel in map units, so strokes and labels stay constant while zooming.
  const px = cam ? 1 / (cam.u * cam.s) : 1;
  const hud = chapters[active]?.hud ?? "";

  return (
    <div className="relative lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {/* Map frame */}
      <div
        ref={frameRef}
        aria-hidden="true"
        className="sticky top-16 z-20 h-[46svh] overflow-hidden border-b border-line bg-bg lg:z-0 lg:h-[calc(100dvh-4rem)] lg:border-r lg:border-b-0"
      >
        <div
          className="absolute top-0 left-0 origin-top-left transition-transform duration-[1600ms] ease-in-out-quart will-change-transform"
          style={{
            width: size ? size.w : "100%",
            aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}`,
            transform: cam?.transform,
          }}
        >
          {/* The grid is a raster mask: fade it as the camera zooms so lines stay fine. */}
          <div
            className="map-layer map-grid transition-opacity duration-[1600ms]"
            style={{ opacity: cam ? Math.min(1, 1.5 / cam.s) : 1 }}
          />
          <div className="map-layer map-land" />
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="absolute inset-0 size-full overflow-visible"
            style={{ "--px": px } as CSSProperties}
          >
            {(Object.keys(countryPaths) as Array<keyof typeof countryPaths>).map((code) => {
              const lit =
                code === "BR" ||
                (code in ROUTE_CHAPTER && active >= ROUTE_CHAPTER[code as RouteCode]);
              return (
                <path
                  key={code}
                  d={countryPaths[code]}
                  className="transition-[fill] duration-1000 ease-out-expo"
                  style={{ fill: lit ? "var(--map-country-active)" : "var(--map-country)" }}
                />
              );
            })}
            {(Object.keys(ROUTES) as RouteCode[]).map((code) => {
              const drawn = active >= ROUTE_CHAPTER[code];
              return (
                <g key={code}>
                  {/* Ghost track: the whole route, faint and dashed. */}
                  <path
                    d={ROUTES[code]}
                    fill="none"
                    stroke="var(--route)"
                    strokeOpacity={0.35}
                    style={{
                      strokeWidth: "calc(1 * var(--px))",
                      strokeDasharray: "calc(4 * var(--px)) calc(6 * var(--px))",
                    }}
                    className="transition-[stroke-width] duration-[1600ms] ease-in-out-quart"
                  />
                  <path
                    d={ROUTES[code]}
                    fill="none"
                    stroke="var(--route)"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1 1"
                    style={{
                      strokeWidth: "calc(2.5 * var(--px))",
                      strokeDashoffset: drawn ? 0 : 1,
                      transition:
                        "stroke-dashoffset 2000ms var(--ease-out-expo) 250ms, stroke-width 1600ms var(--ease-in-out-quart)",
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {(Object.keys(cities) as Array<keyof typeof cities>).map((key) => {
            const city = cities[key];
            const reached = active >= CITY_CHAPTER[key];
            const current = active === CITY_CHAPTER[key];
            return (
              <div
                key={key}
                className="absolute"
                style={{
                  left: `${(city.x / MAP_WIDTH) * 100}%`,
                  top: `${(city.y / MAP_HEIGHT) * 100}%`,
                }}
              >
                <div
                  className="flex -translate-x-[6px] -translate-y-1/2 items-center gap-2 transition-transform duration-[1600ms] ease-in-out-quart"
                  style={{ transform: `scale(${cam ? 1 / cam.s : 1})`, transformOrigin: "6px 50%" }}
                >
                  <span className="relative grid size-3 place-items-center">
                    {current && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-route opacity-40" />
                    )}
                    <span
                      className={cn(
                        "size-3 rounded-full border-2 transition-colors duration-700",
                        reached ? "border-route bg-route" : "border-ink-muted bg-bg",
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "type-mono rounded-xs bg-bg/85 px-1.5 py-0.5 whitespace-nowrap backdrop-blur-sm transition-opacity duration-700",
                      reached ? "text-ink opacity-100" : "text-ink-muted opacity-70",
                    )}
                  >
                    {city.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Soft chart edges instead of a hard crop. */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_30px_var(--bg)]" />

        {/* HUD */}
        <div className="type-mono pointer-events-none absolute top-4 left-4 flex items-center gap-3 text-ink-muted lg:top-8 lg:left-8">
          <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">GG</span>
          <span key={hud} className="animate-[hud-in_600ms_var(--ease-out-expo)]">
            {hud}
          </span>
        </div>
        <div className="type-mono pointer-events-none absolute right-4 bottom-4 text-ink-muted lg:right-8 lg:bottom-8">
          ×{cam ? cam.s.toFixed(1) : "1.0"}
        </div>
      </div>

      {/* Chapters (scroll under the map on mobile, beside it on desktop) */}
      <div className="relative z-0 lg:z-10">
        {chapters.map((chapter, index) => (
          <section
            key={index}
            ref={(el) => {
              chapterRefs.current[index] = el;
            }}
            data-chapter={index}
            className="flex min-h-[70svh] items-center px-(--gutter) py-12 lg:min-h-dvh lg:px-14 lg:py-0 xl:px-20"
          >
            {/* Active chapter gets a route marker; text is never dimmed (AA contrast). */}
            <div
              className={cn(
                "relative w-full max-w-xl border-l-2 pl-6 transition-colors duration-700 lg:pl-8",
                active === index ? "border-route" : "border-line",
              )}
            >
              {chapter.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
