"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { assistantCopy as t } from "@/content/assistant";
import { cn } from "@/lib/cn";
import { Logbook, type LogbookHandle } from "./logbook";
import { SealedLetter } from "./sealed-letter";

export type AssistantRequest =
  | { action: "open" }
  | { action: "summary"; slug: string; name?: string }
  | { action: "order"; planId: string; name?: string };

export const ASSISTANT_EVENT = "gg:assistant";

/** Opens the drawer from anywhere in the app (buttons on pathway/plan pages). */
export function requestAssistant(request: AssistantRequest) {
  window.dispatchEvent(new CustomEvent<AssistantRequest>(ASSISTANT_EVENT, { detail: request }));
}

/**
 * "Perguntar às fontes": a tab fixed to the right edge of every app screen
 * opens the logbook as a side panel, already scoped to the pathway on screen.
 * The logbook stays mounted while closed so the entries survive.
 */
export function AssistantDrawer({
  isPro,
  used,
  quota,
  pathways,
}: {
  isPro: boolean;
  used: number;
  quota: number;
  pathways: { slug: string; name: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const logbook = useRef<LogbookHandle>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const slug = pathname.match(/^\/app\/caminhos\/([^/]+)/)?.[1];
  const planId = pathname.match(/^\/app\/planos\/([0-9a-f-]{36})/)?.[1];
  const followed = pathways.find((p) => p.slug === slug);

  useEffect(() => {
    const onRequest = (event: Event) => {
      const request = (event as CustomEvent<AssistantRequest>).detail;
      setOpen(true);
      if (request.action === "summary")
        logbook.current?.summarize({ slug: request.slug, name: request.name });
      if (request.action === "order")
        logbook.current?.orderChecklist({ id: request.planId, name: request.name });
    };
    window.addEventListener(ASSISTANT_EVENT, onRequest);
    return () => window.removeEventListener(ASSISTANT_EVENT, onRequest);
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    // Pointer devices start typing right away; on touch, focusing the field
    // would pop the keyboard over the log, so focus the close button instead.
    const fine = window.matchMedia("(pointer: fine)").matches;
    (
      (fine && panel?.querySelector<HTMLElement>("textarea")) ||
      panel?.querySelector<HTMLElement>("a, button")
    )?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        tabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/app/assistente")) return null;

  const close = () => {
    setOpen(false);
    tabRef.current?.focus();
  };

  return (
    <>
      <button
        ref={tabRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "group fixed top-1/2 right-0 z-50 flex -translate-y-1/2 animate-[tab-in_700ms_var(--ease-out-expo)_600ms_both] flex-col items-center gap-3 rounded-l-sm bg-abissal py-4 pr-2 pl-2.5 text-glacial shadow-lift transition-[padding] duration-300 ease-out-expo hover:pr-3.5 dark:bg-glacial dark:text-abissal",
          open && "invisible",
        )}
      >
        <span aria-hidden="true" className="size-2 rounded-full bg-route ring-4 ring-route/25" />
        <span aria-hidden="true" className="h-6 border-l border-dashed border-current opacity-60" />
        <span className="rotate-180 text-[0.8125rem] font-semibold tracking-[0.02em] [writing-mode:vertical-rl]">
          {t.tab}
        </span>
      </button>

      <div className={cn("fixed inset-0 z-[70]", !open && "hidden")}>
        <button
          type="button"
          aria-label={t.close}
          tabIndex={-1}
          onClick={close}
          className="absolute inset-0 animate-[backdrop-in_400ms_var(--ease-out-expo)_both] bg-abissal/40 backdrop-blur-[2px]"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-title"
          className="absolute inset-y-0 right-0 grid w-full max-w-[34rem] animate-[panel-in_600ms_var(--ease-out-expo)_both] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] bg-bg shadow-lift"
        >
          <header className="grid gap-3 border-b border-line px-5 pt-5 pb-4 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <p id="assistant-title" className="type-eyebrow">
                {t.panelTitle}
              </p>
              <button
                type="button"
                onClick={close}
                className="type-mono rounded-sm px-2 py-1 text-ink-muted hover:text-ink"
              >
                {t.close} ✕
              </button>
            </div>
            <span
              aria-hidden="true"
              className="block h-px w-full bg-[linear-gradient(90deg,var(--route)_50%,transparent_50%)] bg-[length:10px_1px]"
            />
            {isPro && (slug || planId) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="type-mono text-ink-muted">{t.actions.lead}</span>
                {slug && (
                  <button
                    type="button"
                    onClick={() => logbook.current?.summarize({ slug, name: followed?.name })}
                    className="link-route text-[0.9375rem] font-semibold text-green-ink"
                  >
                    {t.actions.summary}
                  </button>
                )}
                {planId && (
                  <button
                    type="button"
                    onClick={() => logbook.current?.orderChecklist({ id: planId })}
                    className="link-route text-[0.9375rem] font-semibold text-green-ink"
                  >
                    {t.actions.order}
                  </button>
                )}
              </div>
            )}
          </header>
          {isPro ? (
            <Logbook
              variant="panel"
              used={used}
              quota={quota}
              pathways={pathways}
              defaultPathway={followed?.slug}
              handle={logbook}
            />
          ) : (
            <div className="overflow-y-auto p-5 sm:p-7">
              <SealedLetter />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Button placed on a page that asks the drawer to run a task. */
export function AssistantAction({
  request,
  children,
}: {
  request: AssistantRequest;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => requestAssistant(request)}
      className="group/btn inline-flex h-11 items-center gap-3 rounded-sm px-4 text-[0.9375rem] font-semibold text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] transition-shadow duration-300 ease-out-expo hover:shadow-[inset_0_0_0_1.5px_var(--route)]"
    >
      <span aria-hidden="true" className="flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-route" />
        <span className="w-4 border-t border-dashed border-route transition-[width] duration-500 ease-out-expo group-hover/btn:w-6" />
        <span className="size-1.5 rounded-full border border-route" />
      </span>
      {children}
    </button>
  );
}
