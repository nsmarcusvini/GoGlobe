"use client";

import Link from "next/link";
import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { assistantCopy as t } from "@/content/assistant";
import { readEvents, type CitedSource } from "@/lib/ai/protocol";
import { cn } from "@/lib/cn";
import { AnswerBody, citedIn } from "./answer-body";
import { Detour } from "./detour";
import { SourceCard } from "./source-card";

/* Traçado de Rota: the conversation is a logbook. Each entry is a dated record
   whose left margin is a dashed trail; every citation drives a marker into it
   and lights its official source in the column beside (below, when narrow).
   Advice requests become a "fora da rota" detour sign. */

export type EntryKind = "question" | "summary" | "order";

type Entry = {
  id: string;
  kind: EntryKind;
  title: string;
  subtitle?: string;
  at: string;
  text: string;
  sources: CitedSource[];
  status: "streaming" | "done" | "error";
  advice: boolean;
  error?: string;
};

type Body =
  | { mode: "chat"; messages: { role: "user" | "assistant"; content: string }[]; pathway?: string }
  | { mode: "summary"; pathway: string }
  | { mode: "checklist_order"; planId: string };

export type LogbookHandle = {
  summarize(pathway: { slug: string; name?: string }): void;
  orderChecklist(plan: { id: string; name?: string }): void;
};

export type LogbookProps = {
  variant: "page" | "panel";
  used: number;
  quota: number;
  pathways: { slug: string; name: string }[];
  defaultPathway?: string;
  handle?: Ref<LogbookHandle>;
};

const clock = () =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

export function Logbook({
  variant,
  used: initialUsed,
  quota: initialQuota,
  pathways,
  defaultPathway,
  handle,
}: LogbookProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [used, setUsed] = useState(initialUsed);
  const [quota, setQuota] = useState(initialQuota);
  const [context, setContext] = useState(defaultPathway ?? "");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const seq = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const patch = useCallback((id: string, update: (e: Entry) => Partial<Entry>) => {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...update(e) } : e)));
  }, []);

  const run = useCallback(
    async (kind: EntryKind, title: string, body: Body, subtitle?: string) => {
      if (busy) return;
      seq.current += 1;
      const id = `reg-${seq.current}`;
      setBusy(true);
      setNotice(null);
      setEntries((list) => [
        ...list,
        {
          id,
          kind,
          title,
          subtitle,
          at: clock(),
          text: "",
          sources: [],
          status: "streaming",
          advice: false,
        },
      ]);
      requestAnimationFrame(() =>
        endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }),
      );
      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok || !response.body) {
          const { error } = (await response.json().catch(() => ({}))) as { error?: string };
          if (response.status === 429 && error?.includes("mensagens do mês")) setUsed(quota);
          patch(id, () => ({ status: "error", error: error ?? t.errors.generic }));
          return;
        }
        for await (const event of readEvents(response.body)) {
          if (event.type === "meta") {
            setUsed(event.used);
            setQuota(event.quota);
            patch(id, () => ({ sources: event.sources, advice: event.advice }));
          } else if (event.type === "text") {
            patch(id, (e) => ({ text: e.text + event.text }));
          } else if (event.type === "done") {
            patch(id, (e) => ({
              status: "done",
              advice: e.advice || event.stopReason === "refusal",
            }));
          } else {
            patch(id, () => ({ status: "error", error: event.message }));
          }
        }
        patch(id, (e) => (e.status === "streaming" ? { status: "done" } : {}));
      } catch {
        patch(id, () => ({ status: "error", error: t.errors.network }));
      } finally {
        setBusy(false);
      }
    },
    [busy, patch, quota],
  );

  useImperativeHandle(
    handle,
    () => ({
      summarize: (p) =>
        run("summary", t.entry.summary, { mode: "summary", pathway: p.slug }, p.name),
      orderChecklist: (plan) =>
        run("order", t.entry.order, { mode: "checklist_order", planId: plan.id }, plan.name),
    }),
    [run],
  );

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    if (used >= quota) {
      setNotice(t.quotaOut);
      return;
    }
    // Previous answered questions give the model the thread (last three).
    const history = entries
      .filter((e) => e.kind === "question" && e.status === "done" && !e.advice && e.text)
      .slice(-3)
      .flatMap((e) => [
        { role: "user" as const, content: e.title },
        { role: "assistant" as const, content: e.text },
      ]);
    setDraft("");
    const scope = pathways.find((p) => p.slug === context);
    void run(
      "question",
      q,
      {
        mode: "chat",
        messages: [...history, { role: "user", content: q }],
        pathway: context || undefined,
      },
      scope?.name ?? t.context.all,
    );
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(draft);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      ask(draft);
    }
  };

  const panel = variant === "panel";

  return (
    <div
      className={cn(
        "@container grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)]",
        panel ? "grid-rows-[minmax(0,1fr)_auto]" : "gap-10",
      )}
    >
      <div
        className={cn(
          "min-h-0",
          panel && "overflow-y-auto overscroll-contain px-5 pt-6 pb-10 sm:px-7",
        )}
      >
        {entries.length === 0 ? (
          <EmptyLog onPick={ask} disabled={busy || used >= quota} />
        ) : (
          <ol className="grid gap-14">
            {entries.map((entry, i) => (
              <EntryView key={entry.id} entry={entry} index={i + 1} />
            ))}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] gap-3 bg-bg",
          panel
            ? "border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7"
            : "sticky bottom-0 border-t border-line pt-5 pb-5",
        )}
      >
        {pathways.length > 1 && (
          <label className="flex flex-wrap items-center gap-2 text-[0.9375rem]">
            <span className="type-mono text-ink-muted">{t.context.label}</span>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="h-9 max-w-full min-w-0 rounded-sm border border-line-strong bg-surface px-2 text-[0.9375rem]"
            >
              <option value="">{t.context.all}</option>
              {pathways.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <label className="grid gap-1.5">
            <span className="sr-only">{t.composer.label}</span>
            <textarea
              name="question"
              rows={2}
              maxLength={1500}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t.composer.placeholder}
              aria-describedby="assistant-stamp"
              className="field-sizing-content max-h-40 min-h-[3.25rem] w-full resize-none rounded-sm border border-line-strong bg-surface px-3.5 py-3 text-base leading-snug placeholder:text-ink-muted/80 focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-focus"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="group/btn inline-flex h-[3.25rem] items-center gap-2.5 rounded-sm bg-cta px-5 font-semibold text-cta-ink shadow-sm transition-[background-color,box-shadow] duration-300 ease-out-expo hover:bg-cta-hover hover:shadow-md disabled:opacity-50"
          >
            <span>{busy ? t.composer.sending : t.composer.submit}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 12"
              className="h-3 w-6 transition-transform duration-500 ease-out-expo group-hover/btn:translate-x-1"
            >
              <path
                d="M0 6h22M17 1l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeDasharray="3 2.4"
              />
            </svg>
          </button>
        </div>
        {notice && (
          <p role="status" className="text-[0.9375rem] font-medium text-(--status-info)">
            {notice}
          </p>
        )}
        <div className="grid items-start gap-3 @2xl:grid-cols-[minmax(0,1fr)_auto]">
          <Stamp />
          <Gauge used={used} quota={quota} />
        </div>
      </form>
    </div>
  );
}

function EntryView({ entry, index }: { entry: Entry; index: number }) {
  const cited = citedIn(entry.text, entry.sources.length);
  const shown = entry.sources.filter((s) => cited.has(s.n));
  const hidden = entry.sources.length - shown.length;
  const [active, setActive] = useState<number | null>(null);
  const [thread, setThread] = useState<{ d: string; key: number } | null>(null);
  const wrapRef = useRef<HTMLLIElement>(null);
  const streaming = entry.status === "streaming";

  // The moment: a cartographic thread from the marker to its source card.
  const activate = (n: number | null, marker?: HTMLElement) => {
    setActive(n);
    const wrap = wrapRef.current;
    const card = n ? wrap?.querySelector<HTMLElement>(`[data-source="${n}"]`) : null;
    if (!wrap || !marker || !card) {
      setThread(null);
      return;
    }
    const base = wrap.getBoundingClientRect();
    const m = marker.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    if (c.left <= m.right) {
      // Stacked layout: bring the card into view instead of drawing across.
      setThread(null);
      card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    const x1 = m.right - base.left + 2;
    const y1 = m.top + m.height / 2 - base.top;
    const x2 = c.left - base.left - 2;
    const y2 = c.top + 22 - base.top;
    const dx = Math.max(24, (x2 - x1) / 2);
    setThread({
      d: `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`,
      key: Date.now(),
    });
  };

  const kindLabel =
    entry.kind === "question"
      ? t.entry.question
      : entry.kind === "summary"
        ? t.entry.summary
        : t.entry.order;

  return (
    <li
      ref={wrapRef}
      id={entry.id}
      aria-busy={streaming}
      className="relative grid animate-[card-in_700ms_var(--ease-out-expo)_both] gap-6"
    >
      <header className="grid gap-2">
        <p className="type-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-muted">
          <span className="text-accent">REG. {String(index).padStart(2, "0")}</span>
          <span aria-hidden="true" className="h-px w-6 bg-line-strong" />
          <span>{entry.at}</span>
          {entry.kind !== "question" && <span className="text-green-ink">{kindLabel}</span>}
          {entry.kind === "question" && entry.subtitle && (
            <span className="truncate">· {entry.subtitle}</span>
          )}
        </p>
        {entry.kind === "question" ? (
          <h2 className="type-title max-w-[26ch] text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] break-words">
            {entry.title}
          </h2>
        ) : (
          <h2 className="type-title text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)]">
            {entry.subtitle ?? entry.title}
          </h2>
        )}
      </header>

      {entry.advice && entry.status !== "error" ? (
        <Detour text={entry.text} streaming={streaming} />
      ) : (
        <div className="grid gap-8 @3xl:grid-cols-[minmax(0,1fr)_17rem] @3xl:gap-14">
          <div className="min-w-0">
            {entry.status === "error" && !entry.text ? (
              <p
                role="alert"
                className="border-l-2 border-(--status-fails) pl-4 text-(--status-fails)"
              >
                {entry.error}
              </p>
            ) : (
              <>
                <AnswerBody
                  text={entry.text}
                  sources={entry.sources}
                  streaming={streaming}
                  active={active}
                  onActivate={activate}
                />
                {entry.kind === "order" && entry.status === "done" && (
                  <p className="mt-5 pl-10 text-[0.9375rem] text-ink-muted">{t.entry.orderNote}</p>
                )}
                {entry.status === "error" && (
                  <p role="alert" className="mt-4 pl-10 text-[0.9375rem] text-(--status-fails)">
                    {entry.error}
                  </p>
                )}
              </>
            )}
          </div>

          {entry.status !== "error" && (
            <aside
              aria-label={`${t.entry.sources} do registro ${index}`}
              className="grid content-start gap-3"
            >
              <p className="type-eyebrow">{t.entry.sources}</p>
              {shown.length === 0 && !streaming && entry.sources.length === 0 && (
                <p className="text-[0.9375rem] text-ink-muted">{t.entry.noSources}</p>
              )}
              <ul className="grid gap-3">
                {shown.map((s) => (
                  <SourceCard key={s.n} source={s} active={active === s.n} />
                ))}
              </ul>
              {hidden > 0 && !streaming && (
                <details className="group text-[0.9375rem]">
                  <summary className="type-mono cursor-pointer text-ink-muted hover:text-ink">
                    {t.entry.consulted(hidden)}
                  </summary>
                  <ul className="mt-3 grid gap-3">
                    {entry.sources
                      .filter((s) => !cited.has(s.n))
                      .map((s) => (
                        <SourceCard key={s.n} source={s} active={false} muted />
                      ))}
                  </ul>
                </details>
              )}
            </aside>
          )}
        </div>
      )}

      {thread && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible @3xl:block"
        >
          <path
            key={thread.key}
            d={thread.d}
            pathLength={1}
            fill="none"
            stroke="var(--route)"
            strokeWidth="1.5"
            strokeDasharray="1"
            className="animate-[route-draw_620ms_var(--ease-out-expo)_both]"
          />
        </svg>
      )}

      <p className="sr-only" aria-live="polite">
        {entry.status === "done" ? t.entry.done : ""}
      </p>
    </li>
  );
}

function EmptyLog({ onPick, disabled }: { onPick: (q: string) => void; disabled: boolean }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <p className="type-mono text-accent">REG. 00</p>
        <p className="type-title text-[clamp(1.6rem,1.2rem+1.6vw,2.4rem)]">{t.empty.title}</p>
        <p className="max-w-(--measure) text-ink-muted">{t.empty.body}</p>
      </div>
      <ul className="relative grid gap-2 pl-8">
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[0.6875rem] border-l border-dashed border-accent/60"
        />
        {t.empty.examples.map((q) => (
          <li key={q} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-1/2 -left-[1.6rem] size-2.5 -translate-y-1/2 rounded-full border-2 border-accent bg-bg"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(q)}
              className="link-route text-left text-[1.0625rem] font-medium disabled:opacity-50"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The legal notice, stamped next to where the person types. */
function Stamp() {
  return (
    <aside
      id="assistant-stamp"
      aria-label={t.stamp.label}
      data-testid="assistant-legal"
      className="relative grid max-w-[46ch] -rotate-[0.4deg] gap-1 rounded-xs border-[1.5px] border-accent/70 px-3 py-2 motion-reduce:rotate-0"
    >
      <span className="type-eyebrow text-[0.6875rem]">{t.stamp.label}</span>
      <span className="text-[0.8125rem] leading-snug text-ink">
        {t.stamp.text}{" "}
        <Link href="/aviso-legal" className="link-inline font-semibold">
          {t.stamp.link}
        </Link>
      </span>
    </aside>
  );
}

/** Monthly quota as a fuel gauge: segments empty as messages are used. */
function Gauge({ used, quota }: { used: number; quota: number }) {
  const segments = 12;
  const left = Math.max(0, quota - used);
  const lit = Math.ceil((left / Math.max(quota, 1)) * segments);
  const low = left / Math.max(quota, 1) <= 0.15;
  return (
    <div
      role="meter"
      aria-label={t.gaugeLabel}
      aria-valuemin={0}
      aria-valuemax={quota}
      aria-valuenow={used}
      aria-valuetext={`${t.gauge(used, quota)}, ${t.gaugeRenew}`}
      className="grid justify-items-start gap-1.5 @2xl:justify-items-end"
    >
      <span className="flex items-end gap-[3px]" aria-hidden="true">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            style={{ height: `${8 + i * 1.1}px` }}
            className={cn(
              "w-[5px] rounded-[1px] transition-colors duration-700 ease-out-expo",
              i < lit ? (low ? "bg-(--status-info)" : "bg-route") : "bg-line-strong/60",
            )}
          />
        ))}
      </span>
      <span className="type-mono text-ink-muted">
        {t.gauge(used, quota)} · {t.gaugeRenew}
      </span>
    </div>
  );
}
