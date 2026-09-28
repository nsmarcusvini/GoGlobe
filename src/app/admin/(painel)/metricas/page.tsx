import type { Metadata } from "next";
import Link from "next/link";
import { checkAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Métricas" };

const STEP_LABELS: Record<string, string> = {
  landing_view: "Visitou a página inicial",
  signup_started: "Pediu link de acesso",
  signup_completed: "Criou conta",
  onboarding_completed: "Completou o perfil",
  results_viewed: "Viu resultados",
  pathway_followed: "Acompanhou um caminho",
  pro_interest: "Interesse no Pro (lista de espera)",
  checkout_started: "Iniciou pagamento",
  subscription_active: "Assinatura ativa",
};

const pct = (value: number) => `${(value * 100).toFixed(value > 0 && value < 0.1 ? 1 : 0)}%`;
const DAYS = [7, 30, 90] as const;

export default async function MetricsPage({ searchParams }: PageProps<"/admin/metricas">) {
  const params = await searchParams;
  const days = DAYS.includes(Number(params.dias) as (typeof DAYS)[number])
    ? Number(params.dias)
    : 30;
  const { supabase } = await checkAdmin();
  const [funnel, retention] = await Promise.all([
    supabase.rpc("admin_funnel", { p_days: days }),
    supabase.rpc("admin_retention", { p_weeks: 8 }),
  ]);
  if (funnel.error || retention.error) {
    return (
      <p role="alert">
        Não foi possível carregar as métricas: {(funnel.error ?? retention.error)?.message}
      </p>
    );
  }

  const steps = funnel.data ?? [];
  const max = Math.max(1, ...steps.map((s) => Number(s.people)));

  const cohorts = new Map<string, { size: number; weeks: Map<number, number> }>();
  for (const row of retention.data ?? []) {
    const entry = cohorts.get(row.cohort) ?? { size: Number(row.size), weeks: new Map() };
    entry.weeks.set(row.week, Number(row.active));
    cohorts.set(row.cohort, entry);
  }
  const weekCols = Array.from({ length: 8 }, (_, i) => i);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });

  return (
    <div className="grid gap-16">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-2">
          <Link href="/admin" className="type-mono link-route w-fit text-ink-muted">
            ← Caminhos
          </Link>
          <h1 className="type-title">Métricas</h1>
          <p className="type-mono text-ink-muted">
            Pessoas distintas por etapa. Só inclui quem aceitou a medição (LGPD).
          </p>
        </div>
        <nav aria-label="Período" className="type-mono flex gap-1">
          {DAYS.map((d) => (
            <Link
              key={d}
              href={`/admin/metricas?dias=${d}`}
              aria-current={d === days ? "page" : undefined}
              className={`rounded-sm px-3 py-1.5 ${d === days ? "bg-ink text-bg" : "text-ink-muted hover:text-ink"}`}
            >
              {d} dias
            </Link>
          ))}
        </nav>
      </header>

      {/* Funnel as a route that narrows as conversion drops. */}
      <section aria-labelledby="funnel-title" className="grid gap-6">
        <h2 id="funnel-title" className="type-eyebrow">
          Funil · últimos {days} dias
        </h2>
        <ol className="relative grid">
          {steps.map((step, i) => {
            const people = Number(step.people);
            const prev = i > 0 ? Number(steps[i - 1]!.people) : null;
            const width = Math.max(2, (people / max) * 28);
            return (
              <li
                key={step.step}
                className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4"
              >
                <span className="relative grid h-16 place-items-center">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full bg-route transition-[width] duration-700"
                    style={{ width }}
                  />
                  <span
                    aria-hidden="true"
                    className="relative size-3 rounded-full border-2 border-route bg-bg"
                  />
                </span>
                <span className="grid gap-0.5">
                  <span className="font-semibold">{STEP_LABELS[step.step] ?? step.step}</span>
                  <span className="type-mono text-ink-muted">{step.step}</span>
                </span>
                <span className="type-mono tabular grid justify-items-end">
                  <span className="text-lg font-semibold">{people}</span>
                  <span className="text-ink-muted">
                    {prev === null
                      ? "—"
                      : prev > 0
                        ? `${pct(people / prev)} da etapa anterior`
                        : "—"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Weekly retention cohorts. */}
      <section aria-labelledby="retention-title" className="grid gap-6">
        <h2 id="retention-title" className="type-eyebrow">
          Retenção semanal · coortes por semana de cadastro
        </h2>
        {cohorts.size === 0 ? (
          <p className="text-ink-muted">Ainda não há dados de coortes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="type-mono tabular w-full min-w-[42rem] text-center">
              <thead className="text-ink-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">
                    Semana
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Pessoas
                  </th>
                  {weekCols.map((w) => (
                    <th key={w} scope="col" className="py-2 font-medium">
                      S{w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...cohorts.entries()].map(([cohort, data]) => (
                  <tr key={cohort} className="border-b border-line">
                    <th scope="row" className="py-2 text-left font-medium">
                      {date.format(new Date(`${cohort}T00:00:00Z`))}
                    </th>
                    <td className="py-2">{data.size}</td>
                    {weekCols.map((w) => {
                      const active = data.weeks.get(w);
                      const ratio = active && data.size ? active / data.size : 0;
                      return (
                        <td
                          key={w}
                          className="py-2"
                          style={{
                            background: active
                              ? `color-mix(in srgb, var(--route) ${Math.round(ratio * 70) + 8}%, transparent)`
                              : undefined,
                            color: ratio > 0.55 ? "var(--cta-ink)" : undefined,
                          }}
                        >
                          {active ? pct(ratio) : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
