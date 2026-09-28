"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { parseRule, RULE_OPS } from "@/lib/eligibility/rules";
import { useFieldError } from "./action-form";

const EXAMPLES: Record<(typeof RULE_OPS)[number], string> = {
  age_max: '{"op":"age_max","value":44}',
  age_min: '{"op":"age_min","value":18}',
  english_min:
    '{"op":"english_min","tests":[{"test":"IELTS","min_score":6,"scope":"each_component"}]}',
  education_min: '{"op":"education_min","level":"bachelor"}',
  experience_min_years: '{"op":"experience_min_years","value":1}',
  budget_min_brl: '{"op":"budget_min_brl","value":50000}',
  occupation_in_list: '{"op":"occupation_in_list","list":"CSOL"}',
  goal_in: '{"op":"goal_in","goals":["study"]}',
  manual: '{"op":"manual","reason":"Depende de oferta de emprego"}',
};

/** JSON rule editor validated live with the same Zod schema the server uses. */
export function RuleEditor({ defaultValue }: { defaultValue?: string }) {
  const id = useId();
  const serverError = useFieldError("rule");
  const [value, setValue] = useState(defaultValue ?? "");

  const check = useMemo(() => {
    if (!value.trim()) return null;
    try {
      return parseRule(JSON.parse(value));
    } catch {
      return { ok: false as const, error: "JSON inválido." };
    }
  }, [value]);

  const message = check && !check.ok ? check.error : serverError;

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[0.9375rem] font-semibold">
        Regra (JSON)
      </label>
      <textarea
        id={id}
        name="rule"
        rows={3}
        required
        spellCheck={false}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-invalid={message ? true : undefined}
        aria-describedby={`${id}-status`}
        className={cn(
          "type-mono w-full rounded-sm bg-surface px-4 py-3 text-[0.8125rem] leading-relaxed text-ink",
          "shadow-[inset_0_0_0_1px_var(--line-strong)] focus:shadow-[inset_0_0_0_2px_var(--route)] focus:outline-none",
          message && "shadow-[inset_0_0_0_2px_var(--status-fails)]",
        )}
      />
      <p
        id={`${id}-status`}
        aria-live="polite"
        className={cn(
          "type-mono",
          message ? "text-(--status-fails)" : check?.ok ? "text-green-ink" : "text-ink-muted",
        )}
      >
        {message ?? (check?.ok ? `Regra válida: ${check.rule.op}` : "Escreva a regra em JSON.")}
      </p>
      <details className="text-[0.875rem] text-ink-muted">
        <summary className="cursor-pointer font-medium text-ink">Operadores e exemplos</summary>
        <ul className="mt-2 grid gap-1">
          {RULE_OPS.map((op) => (
            <li key={op} className="flex flex-wrap items-baseline gap-2">
              <button
                type="button"
                onClick={() => setValue(EXAMPLES[op])}
                className="type-mono rounded-xs bg-surface-sunk px-1.5 py-0.5 text-ink hover:bg-line"
              >
                {op}
              </button>
              <code className="type-mono break-all">{EXAMPLES[op]}</code>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
