"use client";

import { createContext, useActionState, useContext, type ReactNode } from "react";
import type { ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const ErrorsContext = createContext<Record<string, string> | undefined>(undefined);

/** Field-level error for `name` from the last submission of the enclosing form. */
export function useFieldError(name: string): string | undefined {
  return useContext(ErrorsContext)?.[name];
}

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Form bound to a Server Action with pending state, a status line and field
 * errors (read by the controls through context).
 */
export function ActionForm({
  action,
  submitLabel,
  submitVariant = "primary",
  confirmMessage,
  className,
  children,
}: {
  action: Action;
  submitLabel: string;
  submitVariant?: "primary" | "secondary" | "ghost";
  confirmMessage?: string;
  className?: string;
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false });

  return (
    <form
      action={formAction}
      className={cn("grid gap-5", className)}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <ErrorsContext.Provider value={state.errors}>{children}</ErrorsContext.Provider>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant={submitVariant} disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
        {state.message && (
          <p
            role={state.ok ? "status" : "alert"}
            className={cn(
              "text-[0.9375rem] font-medium",
              state.ok ? "text-green-ink" : "text-(--status-fails)",
            )}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
