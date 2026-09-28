"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleItem } from "@/app/(app)/app/actions";
import { baseCopy as t } from "@/content/base";
import type { BaseRoute, Stop } from "@/lib/data/base";
import { cn } from "@/lib/cn";

/* Próxima Parada: the checklist as the current leg of the trip. Done stops sit
   faded on the left of a horizontal route (vertical on mobile), the next stop
   is the lit station, and what comes after hangs off a dashed line. An open
   profile shows as an amber stop just before it. Marking the next stop done
   slides it left and lights the following one. */

const date = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export type ProfileStop = { answered: number; total: number } | null;

export function NextStopRoute({
  route,
  profile,
}: {
  route: BaseRoute | null;
  profile: ProfileStop;
}) {
  const router = useRouter();
  // Id of the stop sliding out; the refreshed next stop (another id) arrives clean.
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const markDone = (stop: Stop) => {
    if (!route) return;
    setError(null);
    setLeavingId(stop.id);
    startTransition(async () => {
      const result = await toggleItem(stop.id, route.planId, true);
      if (!result.ok) {
        setLeavingId(null);
        setError(result.message ?? "Não foi possível atualizar o item.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="next-stop-title" className="relative grid gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="type-eyebrow">{t.eyebrow}</p>
        {route && (
          <p className="type-mono text-ink-muted">
            <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">
              {route.pathway.countryCode}
            </span>{" "}
            {route.pathway.name} · {t.route.progress(route.doneCount, route.total)}
          </p>
        )}
      </div>

      <ol
        aria-label={t.route.label}
        className="relative grid gap-6 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))] lg:items-end lg:gap-8"
        style={{
          ["--cols" as string]: String(
            (route?.done.length ?? 0) + (profile ? 1 : 0) + 3 + (route?.upcoming.length ?? 0),
          ),
        }}
      >
        {/* The route line: solid behind the done stops, dashed ahead. */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[0.6875rem] w-0 border-l-2 border-dashed border-accent/50 lg:top-auto lg:right-0 lg:bottom-[0.6875rem] lg:left-0 lg:h-0 lg:w-auto lg:border-t-2 lg:border-l-0"
        />

        {route?.done.map((stop) => (
          <li key={stop.id} className="relative grid gap-2 pl-9 text-ink-muted lg:pb-10 lg:pl-0">
            <Dot kind="done" />
            <span className="type-mono text-green-ink">{t.route.done}</span>
            <span className="line-clamp-2 text-[0.9375rem] line-through decoration-ink-muted/60">
              {stop.title}
            </span>
          </li>
        ))}

        {profile && (
          <li className="relative grid gap-2 pl-9 lg:pb-10 lg:pl-0">
            <Dot kind="open" />
            <span className="type-mono text-(--status-info)">{t.profile.label}</span>
            <span className="font-semibold">{t.profile.title}</span>
            <span className="text-[0.9375rem] text-ink-muted">
              {t.profile.body(profile.answered, profile.total)}
            </span>
            <Link
              href="/app/onboarding"
              className="link-inline w-fit font-semibold text-(--status-info)"
            >
              {t.profile.cta} →
            </Link>
          </li>
        )}

        <li
          key={route?.next?.id ?? "none"}
          className={cn(
            "relative grid gap-5 pl-9 motion-safe:animate-[stop-in_800ms_var(--ease-out-expo)_both] lg:col-span-3 lg:pb-12 lg:pl-0",
            leavingId !== null &&
              leavingId === route?.next?.id &&
              "translate-x-[-3rem] opacity-30 transition-[transform,opacity] duration-700 ease-out-expo",
          )}
        >
          <Dot kind="next" />
          {route?.next ? (
            <>
              <p className="type-mono flex flex-wrap items-center gap-3 text-green-ink">
                {t.route.next}
                {route.next.dueDate && (
                  <span className="rounded-xs border border-(--status-info) px-1.5 py-0.5 text-(--status-info)">
                    {t.route.due(date(route.next.dueDate))}
                  </span>
                )}
              </p>
              <h1
                id="next-stop-title"
                className="type-display max-w-[16ch] text-[clamp(2.25rem,1.2rem+4vw,4.75rem)] break-words"
              >
                {route.next.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => markDone(route.next!)}
                  disabled={pending}
                  className="group/btn inline-flex h-12 items-center gap-3 rounded-sm bg-cta px-6 font-semibold text-cta-ink shadow-sm transition-[background-color,box-shadow] duration-300 ease-out-expo hover:bg-cta-hover hover:shadow-md disabled:opacity-60"
                >
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
                    <circle
                      cx="8"
                      cy="8"
                      r="7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M4.8 8.3l2.2 2.2 4.3-4.6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                  {pending ? t.route.marking : t.route.markDone}
                </button>
                <Link href={`/app/planos/${route.planId}`} className="link-route font-semibold">
                  {t.route.openPlan} →
                </Link>
              </div>
              {error && (
                <p role="alert" className="text-(--status-fails)">
                  {error}
                </p>
              )}
            </>
          ) : route ? (
            <>
              <p className="type-mono text-green-ink">{t.route.next}</p>
              <h1
                id="next-stop-title"
                className="type-display max-w-[18ch] text-[clamp(2.25rem,1.2rem+4vw,4.5rem)]"
              >
                {t.route.arrived}
              </h1>
              <p className="type-lead">{t.route.arrivedBody}</p>
              <Link href={`/app/planos/${route.planId}`} className="link-route w-fit font-semibold">
                {t.route.openPlan} →
              </Link>
            </>
          ) : (
            <>
              <p className="type-mono text-green-ink">{t.route.next}</p>
              <h1
                id="next-stop-title"
                className="type-display max-w-[16ch] text-[clamp(2.25rem,1.2rem+4vw,4.5rem)]"
              >
                {t.route.empty}
              </h1>
              <p className="type-lead">{t.route.emptyBody}</p>
              <Link
                href="/app/resultados"
                className="inline-flex h-12 w-fit items-center rounded-sm bg-cta px-6 font-semibold text-cta-ink hover:bg-cta-hover"
              >
                {t.route.emptyCta} →
              </Link>
            </>
          )}
        </li>

        {route?.upcoming.map((stop, i) => (
          <li
            key={stop.id}
            className={cn("relative grid gap-2 pl-9 lg:pb-10 lg:pl-0", i > 0 && "text-ink-muted")}
          >
            <Dot kind="later" />
            <span className="type-mono text-ink-muted">
              {t.route.later}
              {stop.dueDate ? ` · ${t.route.due(date(stop.dueDate))}` : ""}
            </span>
            <span className="line-clamp-3 text-[0.9375rem]">{stop.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Dot({ kind }: { kind: "done" | "open" | "next" | "later" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-1 left-0 grid size-6 place-items-center rounded-full lg:top-auto lg:bottom-0",
        kind === "done" && "bg-route",
        kind === "open" && "border-2 border-(--status-info) bg-bg",
        kind === "next" && "bg-route shadow-[0_0_0_6px_var(--status-meets-bg)]",
        kind === "later" && "border-2 border-accent/60 bg-bg",
      )}
    >
      {kind === "done" && (
        <svg viewBox="0 0 16 16" className="size-3.5 text-cta-ink">
          <path d="M4.2 8.3l2.4 2.4 5-5.2" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
      {kind === "next" && (
        <span className="size-2.5 rounded-full bg-cta-ink motion-safe:animate-[trail-head_1.6s_var(--ease-in-out-quart)_infinite]" />
      )}
    </span>
  );
}
