"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { aboutCopy as t } from "@/content/about";
import { cn } from "@/lib/cn";

/* Rastreio: a vertical route draws itself as the reader scrolls through five
   stops. On desktop a sticky stage shows the same real requirement changing
   form at each stop (official English → our Portuguese → dated stamp → app
   card → recheck). On mobile each stop carries its own stage inline. Reduced
   motion keeps every state, without the travel. */

export type TraceData = {
  pathway: string;
  countryCode: string;
  host: string;
  sourceUrl: string;
  label: string;
  description: string | null;
  chips: string[];
  excerpt: string[] | null;
  readOn: string | null;
  verifiedOn: string;
  recheckBy: string;
};

export function Trace({ data }: { data: TraceData | null }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const progress = active / (t.steps.length - 1);

  return (
    <section
      aria-label={t.traceLabel}
      className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20"
    >
      <ol className="relative grid">
        {/* The route: dashed track, solid part drawn up to the current stop. */}
        <span
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-[0.6875rem] border-l-2 border-dashed border-accent/40"
        />
        <span
          aria-hidden="true"
          className="absolute top-3 left-[0.6875rem] w-0.5 origin-top bg-route transition-transform duration-700 ease-out-expo max-lg:hidden"
          style={{ height: "calc(100% - 1.5rem)", transform: `scaleY(${progress})` }}
        />
        {t.steps.map((step, i) => (
          <li
            key={step.n}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-step={i}
            className="relative grid content-center gap-4 py-10 pl-12 lg:min-h-[72vh] lg:py-0"
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-11 left-0 grid size-6 place-items-center rounded-full border-2 transition-colors duration-500 lg:top-1/2 lg:-translate-y-1/2",
                i <= active ? "border-route bg-route" : "border-accent/60 bg-bg",
              )}
            >
              {i === active && <span className="size-2 rounded-full bg-cta-ink" />}
            </span>
            <p className="type-mono text-green-ink">{step.n}</p>
            <h2
              className={cn(
                "type-title transition-colors duration-500",
                i === active ? "text-ink" : "lg:text-ink-muted",
              )}
            >
              {step.title}
            </h2>
            <p className="max-w-[48ch] text-ink-muted">{step.body}</p>
            <div className="mt-4 lg:hidden">
              <Stage index={i} data={data} />
            </div>
          </li>
        ))}
      </ol>

      <div className="max-lg:hidden">
        <div className="sticky top-28 grid min-h-[32rem] place-items-center">
          <div className="relative w-full">
            {t.steps.map((step, i) => (
              <div
                key={step.n}
                inert={i !== active}
                className={cn(
                  "transition-[opacity,transform] duration-700 ease-out-expo",
                  i === 0 ? "relative" : "absolute inset-x-0 top-0",
                  i === active ? "opacity-100" : "pointer-events-none opacity-0",
                  i < active && "-translate-y-6",
                  i > active && "translate-y-6",
                )}
              >
                <Stage index={i} data={data} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Frame({
  label,
  children,
  tone = "surface",
}: {
  label: string;
  children: ReactNode;
  tone?: "surface" | "paper";
}) {
  return (
    <figure
      className={cn(
        "grid gap-4 rounded-md border p-6 shadow-md sm:p-8",
        tone === "paper" ? "border-line-strong bg-bg" : "border-line bg-surface",
      )}
    >
      <figcaption className="type-mono text-ink-muted">{label}</figcaption>
      {children}
    </figure>
  );
}

function Stamp({ data }: { data: TraceData }) {
  return (
    <p className="type-mono inline-grid w-fit -rotate-2 gap-0.5 rounded-xs border-2 border-route px-3 py-2 text-green-ink motion-safe:animate-[stamp-in_700ms_var(--ease-spring)_both] motion-reduce:rotate-0">
      <span className="text-[0.75rem] font-bold tracking-[0.16em] uppercase">{t.stage.stamp}</span>
      <span>{data.verifiedOn}</span>
      <span className="text-[0.75rem]">{data.host}</span>
    </p>
  );
}

function Stage({ index, data }: { index: number; data: TraceData | null }) {
  if (!data) {
    return (
      <Frame label={t.steps[index]!.title}>
        <p className="text-ink-muted">{t.stage.noExample}</p>
      </Frame>
    );
  }
  const tag = (
    <p className="type-mono flex flex-wrap items-center gap-2 text-ink-muted">
      <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">
        {data.countryCode}
      </span>
      {data.pathway}
    </p>
  );

  switch (index) {
    case 0:
      return (
        <Frame label={`${t.stage.officialPage} · ${data.host}`} tone="paper">
          {data.excerpt ? (
            <blockquote
              lang="en"
              cite={data.sourceUrl}
              className="grid gap-1.5 border-l-2 border-accent pl-4 text-[1.0625rem]"
            >
              {data.excerpt.map((line, i) => (
                <span
                  key={i}
                  className={
                    i === 0 ? "font-semibold" : /^\d/.test(line) ? "type-mono text-[0.9375rem]" : ""
                  }
                >
                  {line}
                </span>
              ))}
            </blockquote>
          ) : (
            <p className="text-ink-muted">{data.label}</p>
          )}
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="type-mono link-inline w-fit break-all text-accent"
          >
            {data.sourceUrl.replace(/^https:\/\//, "")}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          {data.readOn && <p className="type-mono text-ink-muted">{t.stage.readOn(data.readOn)}</p>}
        </Frame>
      );
    case 1:
      return (
        <Frame label={t.stage.ourSummary}>
          {tag}
          <p className="type-title text-[clamp(1.5rem,1.2rem+1vw,2rem)]">{data.label}</p>
          {data.description && <p className="max-w-[55ch] leading-relaxed">{data.description}</p>}
        </Frame>
      );
    case 2:
      return (
        <Frame label={t.stage.ourSummary}>
          {tag}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="type-title max-w-[18ch] text-[clamp(1.5rem,1.2rem+1vw,2rem)]">
              {data.label}
            </p>
            <Stamp data={data} />
          </div>
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="type-mono link-inline w-fit text-accent"
          >
            {data.host} ↗<span className="sr-only"> (abre em nova aba)</span>
          </a>
        </Frame>
      );
    case 3:
      return (
        <Frame label={t.stage.appCard}>
          {tag}
          <p className="text-[1.125rem] font-semibold">{data.label}</p>
          {data.chips.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {data.chips.map((chip) => (
                <li key={chip} className="type-mono rounded-xs border border-line-strong px-2 py-1">
                  {chip}
                </li>
              ))}
            </ul>
          )}
          <p className="type-mono flex flex-wrap items-center gap-x-2 text-ink-muted">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            Fonte oficial: <span className="font-semibold text-accent">{data.host}</span> ·
            verificado em {data.verifiedOn}
          </p>
          <p className="text-[0.9375rem] text-ink-muted">{t.stage.appNote}</p>
        </Frame>
      );
    default:
      return (
        <Frame label={t.stage.recheck}>
          <div className="flex flex-wrap items-center gap-6">
            <svg viewBox="0 0 64 64" className="size-20 shrink-0" aria-hidden="true">
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="var(--line-strong)"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="var(--route)"
                strokeWidth="4"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset="0.25"
                transform="rotate(-90 32 32)"
                className="motion-safe:animate-[route-draw_1200ms_var(--ease-out-expo)_both]"
              />
            </svg>
            <div className="grid gap-1">
              <p className="type-mono text-ink-muted">{t.stage.recheck}</p>
              <p className="type-title text-[clamp(1.5rem,1.2rem+1vw,2rem)]">
                {t.stage.recheckBy(data.recheckBy)}
              </p>
            </div>
          </div>
          <p className="max-w-[48ch] text-ink-muted">{t.stage.recheckBody}</p>
          <Stamp data={data} />
        </Frame>
      );
  }
}
