"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { joinWaitlist } from "@/app/(marketing)/precos/actions";
import type { ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { waitlistCopy as t } from "@/content/billing";

/**
 * Fake door (PAYMENTS_ENABLED=false): a side panel slides in with an honest
 * "payments aren't open yet" and the waitlist form. Accessible dialog: focus
 * moves in, Esc closes, focus returns to the trigger.
 */
export function WaitlistTrigger({
  children,
  source,
  className,
  variant = "primary",
  size = "lg",
}: {
  children: ReactNode;
  source: string;
  className?: string;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant={variant}
        size={size}
        arrow
        className={className}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      {open && (
        <WaitlistPanel
          source={source}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}

function WaitlistPanel({ source, onClose }: { source: string; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(joinWaitlist, {
    ok: false,
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("input, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && panel) {
        const focusable = [...panel.querySelectorAll<HTMLElement>("a, button, input")].filter(
          (el) => !el.hasAttribute("disabled"),
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label={t.close}
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-[backdrop-in_400ms_var(--ease-out-expo)_both] bg-abissal/40 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-title"
        className="absolute inset-y-0 right-0 grid w-full max-w-md animate-[panel-in_600ms_var(--ease-out-expo)_both] content-start gap-8 overflow-y-auto bg-bg p-8 shadow-lift sm:p-10"
      >
        <div className="flex items-center justify-between">
          <p className="type-eyebrow">{t.eyebrow}</p>
          <button
            type="button"
            onClick={onClose}
            className="type-mono rounded-sm px-2 py-1 text-ink-muted hover:text-ink"
          >
            {t.close} ✕
          </button>
        </div>
        <span aria-hidden="true" className="block h-px w-full bg-route" />
        <h2 id="waitlist-title" className="type-display text-[clamp(2rem,1.4rem+2.4vw,3rem)]">
          {t.title}
        </h2>
        <p className="text-ink-muted">{t.body}</p>
        {state.ok ? (
          <p
            role="status"
            className="rounded-md border-l-2 border-route bg-(--status-meets-bg) p-5 font-semibold"
          >
            {state.message}
          </p>
        ) : (
          <form action={action} className="grid gap-5">
            <input type="hidden" name="source" value={source} />
            <Field
              name="email"
              type="email"
              label={t.emailLabel}
              autoComplete="email"
              required
              error={state.errors?.email}
            />
            <Button type="submit" size="lg" arrow disabled={pending}>
              {pending ? "…" : t.submit}
            </Button>
            {state.message && (
              <p role="alert" className="text-(--status-fails)">
                {state.message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
