import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Text input with a real <label>, hint and error wired through aria-describedby. */
export function Field({ label, hint, error, className, id, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={inputId} className="text-[0.9375rem] font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "h-12 w-full rounded-sm bg-surface px-4 text-ink",
          "shadow-[inset_0_0_0_1px_var(--line-strong)] transition-shadow duration-300 ease-out-expo",
          "placeholder:text-ink-muted/70 hover:shadow-[inset_0_0_0_1px_var(--ink-muted)]",
          "focus:shadow-[inset_0_0_0_2px_var(--route)] focus:outline-none",
          error && "shadow-[inset_0_0_0_2px_var(--status-fails)]",
        )}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-[0.875rem] text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[0.875rem] font-medium text-(--status-fails)">
          {error}
        </p>
      )}
    </div>
  );
}
