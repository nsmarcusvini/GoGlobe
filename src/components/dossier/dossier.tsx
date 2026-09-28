import type { ReactNode } from "react";
import { SourceBlock } from "@/components/ui/source-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { dossierCopy as t } from "@/content/dossier";
import { cn } from "@/lib/cn";
import type { ExchangeRate, PathwayDetail } from "@/lib/data/content";
import type { RequirementResult } from "@/lib/eligibility";
import { DossierIndex } from "./dossier-index";

// Carta de Bordo "dossiê": a giant title, a sticky index drawn as route stops,
// and the official source beside every line. Used by the public pathway page
// and (with `results`) by the personalised app view.

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function Section({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-28 gap-6">
      <h2 id={`${id}-title`} className="flex items-baseline gap-4">
        <span className="type-mono text-green-ink">{index}</span>
        <span className="type-title">{title}</span>
      </h2>
      {children}
    </section>
  );
}

export function Dossier({
  pathway,
  rates,
  results,
  actions,
  breadcrumb,
  footer,
  compact = false,
}: {
  pathway: PathwayDetail;
  rates: Map<string, ExchangeRate>;
  results?: Map<string, RequirementResult>;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  footer?: ReactNode;
  /** App view: smaller title so the personal summary stays above the fold. */
  compact?: boolean;
}) {
  const sources = [
    ...new Set([
      pathway.official_url,
      ...(pathway.points_calculator_url ? [pathway.points_calculator_url] : []),
      ...pathway.requirements.map((r) => r.source_url),
      ...pathway.costs.map((c) => c.source_url),
      ...pathway.steps.map((s) => s.source_url),
      ...pathway.documents.map((d) => d.source_url),
    ]),
  ];
  const sections = [
    { id: "requisitos", label: t.sections.requirements, count: pathway.requirements.length },
    { id: "custos", label: t.sections.costs, count: pathway.costs.length },
    { id: "etapas", label: t.sections.steps, count: pathway.steps.length },
    { id: "documentos", label: t.sections.documents, count: pathway.documents.length },
    { id: "fontes", label: t.sections.sources, count: sources.length },
  ];
  const rateDates = pathway.costs
    .map((c) => rates.get(c.currency)?.fetched_at)
    .filter((d): d is string => !!d);
  const rateDate = rateDates[0] ? dateFormat.format(new Date(rateDates[0])) : null;

  return (
    <article className="grid gap-16">
      {/* Header */}
      <header className="grid gap-8">
        {breadcrumb}
        <div className="grid gap-5">
          <p className="type-mono flex flex-wrap items-center gap-3 text-ink-muted">
            <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">
              {pathway.country.code}
            </span>
            <span>{pathway.official_name}</span>
          </p>
          <h1
            className={
              compact
                ? "type-display max-w-[20ch] text-[clamp(2.25rem,1.2rem+3.2vw,4rem)]"
                : "type-mega max-w-[14ch] text-[clamp(2.75rem,1rem+6.5vw,7.5rem)]"
            }
          >
            {pathway.name_pt}
          </h1>
          <p className="type-lead max-w-[60ch]">{pathway.summary_pt}</p>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-line md:grid-cols-4">
          {[
            [t.facts.category, t.categories[pathway.category]],
            [t.facts.duration, pathway.typical_duration_text ?? "—"],
            [
              t.facts.residence,
              pathway.leads_to_residence ? t.facts.residenceYes : t.facts.residenceNo,
            ],
            [
              t.facts.verified,
              pathway.last_verified_at
                ? dateFormat.format(new Date(pathway.last_verified_at))
                : "—",
            ],
          ].map(([label, value]) => (
            <div key={label} className="grid content-start gap-1 bg-surface p-4">
              <dt className="type-mono text-ink-muted">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        {actions}
      </header>

      <div className="grid gap-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
        <aside className="max-lg:hidden lg:sticky lg:top-28 lg:self-start">
          <DossierIndex sections={sections} />
        </aside>

        <div className="grid min-w-0 gap-20">
          <Section id="requisitos" index="01" title={t.sections.requirements}>
            <ol className="grid border-t border-line">
              {pathway.requirements.map((r) => {
                const result = results?.get(r.key);
                return (
                  <li
                    key={r.id}
                    className="grid gap-3 border-b border-line py-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8"
                  >
                    <div className="grid gap-2">
                      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-lg font-semibold">{r.label_pt}</span>
                        {r.is_hard && <span className="type-mono text-ink-muted">{t.hard}</span>}
                      </p>
                      {r.description_pt && (
                        <p className="max-w-[65ch] text-ink-muted">{r.description_pt}</p>
                      )}
                      {result && (
                        <p className="max-w-[65ch] text-[0.9375rem]">
                          <span className="font-semibold">Pelo que você informou: </span>
                          {result.reason}
                        </p>
                      )}
                      <SourceBlock url={r.source_url} verifiedAt={r.last_verified_at} />
                    </div>
                    {result && <StatusBadge status={result.status} className="self-start" />}
                  </li>
                );
              })}
            </ol>
            {pathway.points_calculator_url && (
              <p className="rounded-md border-l-2 border-accent bg-surface-sunk p-5 text-[0.9375rem]">
                {t.calculatorNote}{" "}
                <a
                  href={pathway.points_calculator_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-inline font-semibold text-accent"
                >
                  {t.calculator}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </p>
            )}
          </Section>

          <Section id="custos" index="02" title={t.sections.costs}>
            <p className="text-ink-muted">{t.costsNote(rateDate)}</p>
            <ul className="grid border-t border-line">
              {pathway.costs.map((c) => {
                const rate = rates.get(c.currency);
                const min = Number(c.amount_min);
                const max = c.amount_max === null ? null : Number(c.amount_max);
                return (
                  <li
                    key={c.id}
                    className="grid gap-2 border-b border-line py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
                  >
                    <div className="grid gap-2">
                      <p className="font-semibold">
                        {c.label_pt}{" "}
                        <span className="type-mono font-normal text-ink-muted">
                          · {c.is_estimate ? t.estimate : t.officialFee}
                        </span>
                      </p>
                      <SourceBlock url={c.source_url} verifiedAt={c.last_verified_at} />
                    </div>
                    <p className="grid justify-items-start gap-0.5 sm:justify-items-end">
                      <span className="type-title text-[1.625rem]">
                        {money(min, c.currency)}
                        {max !== null && ` – ${money(max, c.currency)}`}
                      </span>
                      <span className="type-mono text-ink-muted">
                        {rate
                          ? `≈ ${money(min * Number(rate.brl_rate), "BRL")}${max !== null ? ` – ${money(max * Number(rate.brl_rate), "BRL")}` : ""}`
                          : t.noConversion}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section id="etapas" index="03" title={t.sections.steps}>
            <ol className="relative grid gap-0">
              <span
                aria-hidden="true"
                className="absolute top-3 bottom-3 left-[5px] w-px bg-route"
              />
              {pathway.steps.map((s) => (
                <li key={s.id} className="relative grid gap-1 pb-8 pl-10 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 left-0 size-3 rounded-full border-2 border-route bg-bg"
                  />
                  <p className="flex items-baseline gap-3">
                    <span className="type-mono text-green-ink">
                      {String(s.step_order).padStart(2, "0")}
                    </span>
                    <span className="text-lg font-semibold">{s.title_pt}</span>
                  </p>
                  {s.description_pt && (
                    <p className="max-w-[65ch] text-ink-muted">{s.description_pt}</p>
                  )}
                  {s.estimated_duration_text && (
                    <p className="type-mono text-ink-muted">{s.estimated_duration_text}</p>
                  )}
                </li>
              ))}
            </ol>
          </Section>

          <Section id="documentos" index="04" title={t.sections.documents}>
            <ul className="grid gap-px overflow-hidden rounded-md bg-line sm:grid-cols-2">
              {pathway.documents.map((d) => (
                <li key={d.id} className="grid content-start gap-2 bg-surface p-5">
                  <p className="font-semibold">{d.name_pt}</p>
                  {d.description_pt && (
                    <p className="text-[0.9375rem] text-ink-muted">{d.description_pt}</p>
                  )}
                  <p className="flex flex-wrap gap-2">
                    {d.needs_translation && (
                      <span
                        title={t.translation}
                        className="type-mono rounded-xs bg-(--status-info-bg) px-2 py-1 text-(--status-info)"
                      >
                        {t.translationShort}
                      </span>
                    )}
                    {d.needs_apostille && (
                      <span className="type-mono rounded-xs bg-(--status-info-bg) px-2 py-1 text-(--status-info)">
                        {t.apostille}
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
            {pathway.documents.some((d) => d.needs_translation) && (
              <p className="text-[0.9375rem] text-ink-muted">{t.translation}.</p>
            )}
          </Section>

          <Section id="fontes" index="05" title={t.sections.sources}>
            <ul className="grid gap-2">
              {sources.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "type-mono link-inline break-all text-accent",
                      url === pathway.official_url && "font-semibold",
                    )}
                  >
                    {url}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>

          {footer}
        </div>
      </div>
    </article>
  );
}
