"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { saveItemNotes, toggleItem } from "@/app/(app)/app/actions";
import type { ActionState } from "@/app/admin/actions";
import { appCopy } from "@/content/app";
import { cn } from "@/lib/cn";

export type ChecklistRow = {
  id: string;
  title: string;
  is_done: boolean;
  notes: string | null;
  source_url?: string | null;
  needs_translation?: boolean;
};

const t = appCopy.plan;

/** Vertical route: each item is a stop; the line turns green up to the last done stop. */
export function ChecklistRoute({
  planId,
  title,
  items,
}: {
  planId: string;
  title: string;
  items: ChecklistRow[];
}) {
  const [optimistic, setDone] = useOptimistic(
    items,
    (state, update: { id: string; done: boolean }) =>
      state.map((item) => (item.id === update.id ? { ...item, is_done: update.done } : item)),
  );
  const [, startTransition] = useTransition();
  const lastDone = optimistic.reduce((acc, item, i) => (item.is_done ? i : acc), -1);

  function toggle(item: ChecklistRow) {
    startTransition(async () => {
      setDone({ id: item.id, done: !item.is_done });
      await toggleItem(item.id, planId, !item.is_done);
    });
  }

  if (!items.length) return null;

  return (
    <section aria-label={title} className="grid gap-4">
      <h2 className="type-eyebrow">
        {title} · {optimistic.filter((i) => i.is_done).length}/{optimistic.length}
      </h2>
      <ol className="relative">
        <span
          aria-hidden="true"
          className="absolute top-5 bottom-5 left-[11px] w-0.5 bg-line-strong"
        />
        <span
          aria-hidden="true"
          className="absolute top-5 left-[11px] w-0.5 bg-route transition-[height] duration-700 ease-out-expo"
          style={{
            height: `calc((100% - 2.5rem) * ${lastDone < 0 ? 0 : lastDone / Math.max(optimistic.length - 1, 1)})`,
          }}
        />
        {optimistic.map((item) => (
          <li key={item.id} className="relative grid gap-2 py-3 pl-12">
            <button
              type="button"
              role="checkbox"
              aria-checked={item.is_done}
              aria-label={`${item.is_done ? t.markUndone : t.markDone}: ${item.title}`}
              onClick={() => toggle(item)}
              className={cn(
                "absolute top-3.5 left-0 grid size-6 place-items-center rounded-full border-2 transition-colors duration-300",
                item.is_done
                  ? "border-route bg-route text-cta-ink"
                  : "border-line-strong bg-bg hover:border-route",
              )}
            >
              {item.is_done && (
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5">
                  <path d="M3.5 8.2l3 3 6-6.2" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>
            <p
              className={cn(
                "text-lg leading-snug font-semibold transition-colors",
                item.is_done && "text-ink-muted line-through decoration-1",
              )}
            >
              {item.title}
            </p>
            {item.needs_translation && (
              <p className="type-mono text-(--status-info)">{t.translation}</p>
            )}
            <Notes planId={planId} item={item} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function Notes({ planId, item }: { planId: string; item: ChecklistRow }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveItemNotes.bind(null, item.id, planId),
    { ok: false },
  );
  return (
    <details className="group">
      <summary className="type-mono w-fit cursor-pointer text-ink-muted hover:text-ink">
        {t.notes}
        {item.notes ? " ·  1" : ""}
      </summary>
      <form action={action} className="mt-3 grid max-w-xl gap-3">
        <label className="sr-only" htmlFor={`notes-${item.id}`}>
          {t.notes}: {item.title}
        </label>
        <textarea
          id={`notes-${item.id}`}
          name="notes"
          rows={3}
          defaultValue={item.notes ?? ""}
          className="w-full rounded-sm bg-surface px-4 py-3 text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] focus:shadow-[inset_0_0_0_2px_var(--route)] focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="type-mono rounded-sm px-3 py-2 font-semibold text-green-ink shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-surface-sunk"
          >
            {pending ? "…" : t.saveNotes}
          </button>
          {state.message && (
            <span
              role={state.ok ? "status" : "alert"}
              className={cn("type-mono", state.ok ? "text-green-ink" : "text-(--status-fails)")}
            >
              {state.message}
            </span>
          )}
          {state.errors?.notes && (
            <span role="alert" className="type-mono text-(--status-fails)">
              {state.errors.notes}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}
