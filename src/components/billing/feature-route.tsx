"use client";

import { useEffect, useRef, useState } from "react";
import { pricingCopy as t } from "@/content/billing";
import type { FEATURES } from "@/lib/billing/config";
import { cn } from "@/lib/cn";

type Feature = (typeof FEATURES)[number];

/**
 * Two parallel tracks, Gratuito and Pro, over the 8 feature stops. While the
 * page scrolls, the Pro track draws solid green stop by stop; the free track is
 * dashed and breaks where the feature is not included.
 */
export function FeatureRoute({ features }: { features: Feature[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [reached, setReached] = useState(0);

  useEffect(() => {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-stop]") ?? [])];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.stop);
            setReached((r) => Math.max(r, index + 1));
          }
        }
      },
      { rootMargin: "0px 0px -35% 0px" },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const value = (v: string | boolean) =>
    v === true ? t.included : v === false ? t.notIncluded : v;

  return (
    <div className="grid gap-6">
      <div className="type-mono grid grid-cols-[1fr_5.5rem_5.5rem] items-end gap-4 border-b border-line pb-3 text-ink-muted sm:grid-cols-[1fr_9rem_9rem]">
        <span />
        <span className="pl-6">{t.free}</span>
        <span className="pl-6 font-semibold text-green-ink">{t.pro}</span>
      </div>
      <ol ref={listRef} className="relative">
        {features.map((feature, i) => {
          const freeHas = feature.free !== false;
          const proLit = i < reached;
          return (
            <li
              key={feature.key}
              data-stop={i}
              className="relative grid min-h-[4.5rem] grid-cols-[1fr_5.5rem_5.5rem] items-center gap-4 border-b border-line py-4 sm:grid-cols-[1fr_9rem_9rem]"
            >
              <span className="flex items-baseline gap-3">
                <span className="type-mono text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-semibold">{feature.label}</span>
              </span>

              {/* Free track: dashed, and simply absent where the feature is not included. */}
              <span className="relative flex items-center gap-2 self-stretch pl-6">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -top-4 -bottom-4 left-[5px] border-l-2",
                    freeHas ? "border-dashed border-ink-muted/60" : "border-transparent",
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 size-3 rounded-full border-2 bg-bg",
                    freeHas ? "border-ink-muted" : "border-line-strong",
                  )}
                />
                <span
                  className={cn(
                    "type-mono text-[0.75rem] leading-tight",
                    freeHas ? "text-ink" : "text-ink-muted line-through",
                  )}
                >
                  {value(feature.free)}
                </span>
              </span>

              {/* Pro track: draws solid green as the stop scrolls into view. */}
              <span className="relative flex items-center gap-2 self-stretch pl-6">
                <span
                  aria-hidden="true"
                  className="absolute -top-4 -bottom-4 left-[5px] w-0.5 bg-line"
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-4 left-[5px] w-0.5 bg-route transition-[height] duration-700 ease-out-expo"
                  style={{ height: proLit ? "calc(100% + 2rem)" : "0%" }}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 size-3 rounded-full border-2 border-route transition-colors duration-500",
                    proLit ? "bg-route" : "bg-bg",
                  )}
                />
                <span className="type-mono text-[0.75rem] leading-tight font-semibold text-green-ink">
                  {value(feature.pro)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
