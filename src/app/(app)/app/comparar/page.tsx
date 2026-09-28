import type { Metadata } from "next";
import Link from "next/link";
import { OverlaidTracks, TRACK_COLORS } from "@/components/app/overlaid-tracks";
import { JourneyMap } from "@/components/map/journey-map";
import type { RouteCode } from "@/components/map/routes";
import { Button, ButtonLink } from "@/components/ui/button";
import { compareCopy as t } from "@/content/billing";
import { dossierCopy } from "@/content/dossier";
import { todayInBrasilia } from "@/lib/app/today";
import { getEntitlements } from "@/lib/billing/plan";
import { getExchangeRates, listPathways, toEngineInput } from "@/lib/data/content";
import { requireUser } from "@/lib/data/user";
import { evaluatePathway, profileFromRow } from "@/lib/eligibility";

export const metadata: Metadata = { title: "Comparar caminhos" };

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

export default async function ComparePage({ searchParams }: PageProps<"/app/comparar">) {
  const params = await searchParams;
  const { supabase, profile } = await requireUser("/app/comparar");
  const [{ isPro }, pathways, rates] = await Promise.all([
    getEntitlements(supabase),
    listPathways(supabase),
    getExchangeRates(supabase),
  ]);

  const raw = Array.isArray(params.c)
    ? params.c
    : typeof params.c === "string"
      ? params.c.split(",")
      : [];
  const chosen = [...new Set(raw)].slice(0, 3);
  const selected = chosen
    .map((slug) => pathways.find((p) => p.slug === slug))
    .filter((p): p is (typeof pathways)[number] => !!p);

  const today = todayInBrasilia();
  const engineProfile = profileFromRow(profile);
  const results = selected.map((p) => evaluatePathway(toEngineInput(p), engineProfile, { today }));

  // Official main-applicant fees in BRL, from the published cost items.
  const { data: costs } = selected.length
    ? await supabase
        .from("cost_items")
        .select("pathway_id, amount_min, currency, is_estimate")
        .in(
          "pathway_id",
          selected.map((p) => p.id),
        )
    : { data: [] };
  const feeFor = (pathwayId: string) => {
    let total = 0;
    let missing = false;
    for (const c of (costs ?? []).filter((x) => x.pathway_id === pathwayId && !x.is_estimate)) {
      const rate = rates.get(c.currency);
      if (rate) total += Number(c.amount_min) * Number(rate.brl_rate);
      else missing = true;
    }
    return missing && total === 0 ? "sem conversão" : `≈ ${brl(total)}`;
  };

  const countries = [...new Set(selected.map((p) => p.country.code))].filter((c): c is RouteCode =>
    ["AU", "NZ", "CA"].includes(c),
  );

  return (
    <div className="grid gap-12">
      <header className="grid gap-5">
        <p className="type-eyebrow">{t.eyebrow}</p>
        <h1 className="type-display">{t.title}</h1>
        <p className="type-lead">{t.lead}</p>
      </header>

      <details className="rounded-md bg-surface-sunk p-5" open={selected.length < 2}>
        <summary className="cursor-pointer font-semibold">
          {t.pick} <span className="type-mono font-normal text-ink-muted">· {t.max}</span>
        </summary>
        <form method="get" className="mt-5 grid gap-5">
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {pathways.map((p) => (
              <label key={p.id} className="flex items-start gap-3 py-1">
                <input
                  type="checkbox"
                  name="c"
                  value={p.slug}
                  defaultChecked={chosen.includes(p.slug)}
                  className="mt-1 size-4 accent-(--route)"
                />
                <span>
                  <span className="type-mono text-ink-muted">{p.country.code} </span>
                  {p.name_pt}
                </span>
              </label>
            ))}
          </div>
          <Button type="submit" variant="secondary" className="justify-self-start">
            {t.apply}
          </Button>
        </form>
      </details>

      {!isPro ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border-l-2 border-route bg-surface p-6 shadow-[inset_0_0_0_1px_var(--line)]">
          <p className="font-semibold">{t.proOnly}</p>
          <ButtonLink href="/precos" arrow>
            {t.seePro}
          </ButtonLink>
        </div>
      ) : selected.length < 2 ? (
        <p className="text-ink-muted">{t.empty}</p>
      ) : (
        <>
          <section aria-label="Rotas" className="grid gap-8">
            {countries.length > 0 && (
              <JourneyMap
                routes={countries.map((code) => ({ code }))}
                className="max-w-3xl rounded-md shadow-[inset_0_0_0_1px_var(--line)]"
              />
            )}
            <OverlaidTracks results={results} />
          </section>

          <section aria-label="Comparação por tema" className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left">
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="w-48 py-3" />
                  {selected.map((p, lane) => (
                    <th key={p.id} scope="col" className="px-4 py-3 align-bottom">
                      <span
                        aria-hidden="true"
                        className="mb-2 block h-0.5 w-8"
                        style={{ background: TRACK_COLORS[lane] }}
                      />
                      <Link href={`/app/caminhos/${p.slug}`} className="link-inline font-semibold">
                        {p.name_pt}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="type-mono tabular">
                {[
                  [t.rows.country, selected.map((p) => p.country.name_pt)],
                  [
                    t.rows.requirements,
                    results.map((r) => `${r.summary.meets} de ${r.summary.total} atende`),
                  ],
                  [t.rows.hard, results.map((r) => String(r.summary.hardFailures.length))],
                  [t.rows.fee, selected.map((p) => feeFor(p.id))],
                  [t.rows.duration, selected.map((p) => p.typical_duration_text ?? "—")],
                  [
                    t.rows.residence,
                    selected.map((p) =>
                      p.leads_to_residence
                        ? dossierCopy.facts.residenceYes
                        : dossierCopy.facts.residenceNo,
                    ),
                  ],
                ].map(([label, values]) => (
                  <tr key={label as string} className="border-b border-line">
                    <th scope="row" className="py-4 pr-4 font-sans text-[0.9375rem] font-semibold">
                      {label as string}
                    </th>
                    {(values as string[]).map((value, i) => (
                      <td key={i} className="px-4 py-4">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
