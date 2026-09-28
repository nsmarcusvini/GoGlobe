"use client";

import type { ReactNode } from "react";
import { assistantCopy as t } from "@/content/assistant";
import type { CitedSource } from "@/lib/ai/protocol";
import { cn } from "@/lib/cn";

const MARK = /\[(\d{1,2})\]/g;

/** Citation numbers present in the text that match a real source. */
export function citedIn(text: string, count: number): Set<number> {
  const found = new Set<number>();
  for (const m of text.matchAll(MARK)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= count) found.add(n);
  }
  return found;
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type Block = { kind: "p" | "li"; text: string };

function blocks(text: string): Block[] {
  return text
    .replace(/\*\*/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      /^[-•*]\s+/.test(line) || /^\d+[.)]\s+/.test(line)
        ? { kind: "li" as const, text: line.replace(/^[-•*]\s+/, "") }
        : { kind: "p" as const, text: line },
    );
}

/**
 * The answer as a traced route: a dashed trail runs down the margin, each
 * paragraph's citations appear on it as pins, and every inline [n] is a marker
 * that lights its source. While streaming, the trail's head pulses.
 */
export function AnswerBody({
  text,
  sources,
  streaming,
  active,
  onActivate,
}: {
  text: string;
  sources: CitedSource[];
  streaming: boolean;
  active: number | null;
  onActivate: (n: number | null, el?: HTMLElement) => void;
}) {
  const list = blocks(text);
  const seen = new Set<number>();

  const inline = (value: string): ReactNode[] =>
    value.split(/(\[\d{1,2}\])/g).map((part, i) => {
      const n = Number(part.match(/^\[(\d{1,2})\]$/)?.[1]);
      const source = n ? sources.find((s) => s.n === n) : undefined;
      if (!source) return part;
      const domain = domainOf(source.url);
      return (
        <button
          key={i}
          type="button"
          data-mark={n}
          aria-label={t.entry.mark(n, domain)}
          aria-controls={`fonte-${n}`}
          onMouseEnter={(e) => onActivate(n, e.currentTarget)}
          onFocus={(e) => onActivate(n, e.currentTarget)}
          onClick={(e) => onActivate(n, e.currentTarget)}
          onMouseLeave={() => onActivate(null)}
          onBlur={() => onActivate(null)}
          className={cn(
            "mx-0.5 inline-flex h-[1.2rem] min-w-[1.2rem] -translate-y-[0.1em] animate-[pin-drop_520ms_var(--ease-spring)_both] items-center justify-center rounded-xs border px-1 align-middle font-mono text-[0.6875rem] leading-none font-semibold tabular-nums transition-colors duration-200",
            active === n
              ? "border-route bg-route text-cta-ink"
              : "border-route/70 text-green-ink hover:bg-route hover:text-cta-ink",
          )}
        >
          {n}
        </button>
      );
    });

  if (list.length === 0 && streaming) {
    return (
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)]">
        <Trail pins={[]} head />
        <p className="type-mono self-center text-ink-muted">{t.entry.streaming}</p>
      </div>
    );
  }

  return (
    <div className="grid">
      {list.map((block, i) => {
        const pins = [...citedIn(block.text, sources.length)].filter((n) => !seen.has(n));
        pins.forEach((n) => seen.add(n));
        const last = i === list.length - 1;
        return (
          <div key={i} className="grid grid-cols-[2.5rem_minmax(0,1fr)]">
            <Trail pins={pins} head={streaming && last} end={!streaming && last} active={active} />
            <div
              className={cn(
                "max-w-(--measure) pb-4 text-[1.0625rem] leading-[1.7]",
                block.kind === "li" && "relative pl-5",
              )}
            >
              {block.kind === "li" && (
                <span
                  aria-hidden="true"
                  className="absolute top-[0.8em] left-0 h-px w-2.5 bg-ink-muted"
                />
              )}
              {inline(block.text)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Trail({
  pins,
  head,
  end,
  active,
}: {
  pins: number[];
  head?: boolean;
  end?: boolean;
  active?: number | null;
}) {
  return (
    <div aria-hidden="true" className="relative">
      <span
        className={cn(
          "absolute top-0 left-[0.6875rem] border-l-[1.5px] border-dashed border-accent/55",
          end ? "h-4" : "bottom-0",
        )}
      />
      <div className="relative grid justify-items-start gap-1 pt-1.5">
        {pins.map((n) => (
          <span
            key={n}
            className={cn(
              "grid size-[1.4rem] animate-[pin-drop_520ms_var(--ease-spring)_both] place-items-center rounded-full border-2 font-mono text-[0.625rem] font-bold tabular-nums transition-colors duration-200",
              active === n
                ? "border-route bg-route text-cta-ink"
                : "border-route bg-bg text-green-ink",
            )}
          >
            {n}
          </span>
        ))}
      </div>
      {head && (
        <span className="absolute bottom-3 left-[0.3125rem] size-[0.8rem] rounded-full bg-route motion-safe:animate-[trail-head_1.2s_var(--ease-in-out-quart)_infinite]" />
      )}
      {end && <span className="absolute top-4 left-[0.25rem] h-[2px] w-[0.9rem] bg-accent/70" />}
    </div>
  );
}
