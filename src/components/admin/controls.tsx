"use client";

import { useId, type ComponentProps } from "react";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useFieldError } from "./action-form";

const control =
  "w-full rounded-sm bg-surface px-4 text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] " +
  "transition-shadow duration-300 ease-out-expo hover:shadow-[inset_0_0_0_1px_var(--ink-muted)] " +
  "focus:shadow-[inset_0_0_0_2px_var(--route)] focus:outline-none";

function Hint({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  if (error) {
    return (
      <p
        id={`${id}-error`}
        role="alert"
        className="text-[0.875rem] font-medium text-(--status-fails)"
      >
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={`${id}-hint`} className="text-[0.875rem] text-ink-muted">
      {hint}
    </p>
  ) : null;
}

/** Text input wired to the enclosing ActionForm's errors. */
export function TextField(props: ComponentProps<typeof Field> & { name: string }) {
  const error = useFieldError(props.name);
  return <Field {...props} error={error} />;
}

export function TextArea({
  label,
  hint,
  name,
  className,
  rows = 4,
  ...props
}: ComponentProps<"textarea"> & { label: string; hint?: string; name: string }) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="text-[0.9375rem] font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          control,
          "py-3 leading-relaxed",
          error && "shadow-[inset_0_0_0_2px_var(--status-fails)]",
        )}
        {...props}
      />
      <Hint id={id} hint={hint} error={error} />
    </div>
  );
}

export function Select({
  label,
  hint,
  name,
  options,
  className,
  ...props
}: ComponentProps<"select"> & {
  label: string;
  hint?: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="text-[0.9375rem] font-semibold">
        {label}
      </label>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(control, "h-12", error && "shadow-[inset_0_0_0_2px_var(--status-fails)]")}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Hint id={id} hint={hint} error={error} />
    </div>
  );
}

export function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-5 accent-(--route)"
      />
      <label htmlFor={id} className="text-[0.9375rem]">
        {label}
      </label>
    </div>
  );
}
