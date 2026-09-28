"use client";

import { useState, useTransition } from "react";
import { saveSimulator } from "@/app/(app)/app/actions";
import { ButtonLink } from "@/components/ui/button";
import { simulatorCopy as t } from "@/content/billing";
import { cn } from "@/lib/cn";
import { brl, Odometer } from "./odometer";

export type OfficialRow = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  brl: number | null;
};
export type ExtraRow = { label: string; amount_brl: number };

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    value,
  );

/**
 * Livro-caixa: official fees (converted to R$ by PTAX) plus the person's own
 * lines (Pro). The total rolls like an odometer. Always labelled an estimate.
 */
export function CostLedger({
  planId,
  official,
  initialExtras,
  isPro,
  rateDate,
}: {
  planId: string;
  official: OfficialRow[];
  initialExtras: ExtraRow[];
  isPro: boolean;
  rateDate: string | null;
}) {
  const [extras, setExtras] = useState<ExtraRow[]>(initialExtras);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const officialTotal = official.reduce((sum, row) => sum + (row.brl ?? 0), 0);
  const extrasTotal = extras.reduce(
    (sum, row) => sum + (Number.isFinite(row.amount_brl) ? row.amount_brl : 0),
    0,
  );
  const total = Math.round(officialTotal + (isPro ? extrasTotal : 0));

  function update(index: number, patch: Partial<ExtraRow>) {
    setExtras((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setMessage(null);
  }

  function save() {
    startTransition(async () => {
      const result = await saveSimulator(planId, {
        extras: extras.filter((row) => row.label.trim() !== ""),
      });
      setMessage({ ok: result.ok, text: result.message ?? "" });
    });
  }

  return (
    <section aria-labelledby="ledger-title" className="grid gap-6">
      <div className="grid gap-2 sm:flex sm:items-end sm:justify-between">
        <h2 id="ledger-title" className="type-eyebrow">
          {t.eyebrow}
        </h2>
        <p className="grid justify-items-start gap-1 sm:justify-items-end">
          <span className="type-mono text-ink-muted">{t.total}</span>
          <Odometer
            value={brl(total)}
            className="type-display text-[clamp(2.5rem,1.5rem+3.5vw,4.5rem)]"
          />
        </p>
      </div>

      <div className="relative overflow-hidden rounded-md bg-surface shadow-[inset_0_0_0_1px_var(--line)]">
        <table className="relative w-full text-left">
          <caption className="sr-only">{t.eyebrow}</caption>
          <thead className="type-mono text-ink-muted">
            <tr className="border-b border-line-strong">
              <th scope="col" className="px-4 py-3 font-medium">
                {t.officialTitle}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Moeda oficial
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                R$
              </th>
            </tr>
          </thead>
          <tbody>
            {official.map((row) => (
              <tr key={row.id} className="h-14 border-b border-line">
                <td className="px-4">{row.label}</td>
                <td className="type-mono tabular px-4 text-right text-ink-muted">
                  {money(row.amount, row.currency)}
                </td>
                <td className="type-mono tabular px-4 text-right font-semibold">
                  {row.brl === null ? (
                    <span className="font-normal text-ink-muted">{t.noConversion}</span>
                  ) : (
                    brl(row.brl)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {isPro && (
            <tbody>
              <tr className="border-b border-line-strong">
                <th
                  scope="colgroup"
                  colSpan={3}
                  className="type-mono px-4 pt-6 pb-3 font-medium text-ink-muted"
                >
                  {t.extrasTitle}
                </th>
              </tr>
              {extras.map((row, i) => (
                <tr key={i} className="h-14 border-b border-line">
                  <td className="px-4 py-2">
                    <label className="sr-only" htmlFor={`extra-label-${i}`}>
                      Descrição
                    </label>
                    <input
                      id={`extra-label-${i}`}
                      value={row.label}
                      placeholder={t.labelPlaceholder}
                      maxLength={120}
                      onChange={(e) => update(i, { label: e.target.value })}
                      className="w-full bg-transparent py-2 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setExtras((rows) => rows.filter((_, j) => j !== i))}
                      className="type-mono text-ink-muted hover:text-(--status-fails)"
                    >
                      {t.remove}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <label className="sr-only" htmlFor={`extra-amount-${i}`}>
                      {t.amount}
                    </label>
                    <input
                      id={`extra-amount-${i}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={50}
                      value={Number.isFinite(row.amount_brl) ? row.amount_brl : ""}
                      onChange={(e) => update(i, { amount_brl: Number(e.target.value) })}
                      className="type-mono tabular w-full bg-transparent py-2 text-right font-semibold focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      <p className="type-mono text-ink-muted">{t.estimate(rateDate)}</p>

      {isPro ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setExtras((rows) => [...rows, { label: "", amount_brl: 0 }])}
            disabled={extras.length >= 30}
            className="h-11 rounded-sm px-4 font-semibold shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]"
          >
            + {t.add}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="h-11 rounded-sm bg-cta px-4 font-semibold text-cta-ink hover:bg-cta-hover"
          >
            {pending ? "…" : t.save}
          </button>
          {message && (
            <span
              role={message.ok ? "status" : "alert"}
              className={cn("type-mono", message.ok ? "text-green-ink" : "text-(--status-fails)")}
            >
              {message.text}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-surface-sunk p-5">
          <p>{t.proOnly}</p>
          <ButtonLink href="/precos" variant="secondary" arrow>
            {t.seePro}
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
