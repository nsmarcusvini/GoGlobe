import type { Metadata } from "next";
import Link from "next/link";
import { JourneyMap, type JourneyRoute } from "@/components/map/journey-map";
import type { RouteCode } from "@/components/map/routes";
import { ButtonLink } from "@/components/ui/button";
import { ProgressRoute } from "@/components/ui/progress-route";
import { appCopy } from "@/content/app";
import { listMyPlans, requireUser } from "@/lib/data/user";

export const metadata: Metadata = { title: "Painel" };

const t = appCopy.dashboard;
const ROUTE_CODES = new Set(["AU", "NZ", "CA"]);

export default async function DashboardPage() {
  const { supabase } = await requireUser("/app/painel");
  const plans = await listMyPlans(supabase);

  // One route per country: the most advanced plan in that country sets its fill.
  const byCountry = new Map<string, { done: number; total: number }>();
  for (const plan of plans) {
    const code = plan.pathway.country.code;
    const ratio = plan.total ? plan.done / plan.total : 0;
    const current = byCountry.get(code);
    if (!current || ratio > current.done / Math.max(current.total, 1)) {
      byCountry.set(code, { done: plan.done, total: plan.total });
    }
  }
  const routes: JourneyRoute[] = [...byCountry.entries()]
    .filter(([code]) => ROUTE_CODES.has(code))
    .map(([code, p]) => ({
      code: code as RouteCode,
      progress: p.total ? p.done / p.total : 0,
      caption: t.progress(p.done, p.total),
    }));

  return (
    <div className="grid gap-12">
      <header className="grid gap-5">
        <p className="type-eyebrow">{t.eyebrow}</p>
        <h1 className="type-display">{t.title}</h1>
      </header>

      {plans.length === 0 ? (
        <section className="grid justify-items-start gap-6 rounded-md bg-surface-sunk p-8">
          <p className="type-title">{t.empty}</p>
          <ButtonLink href="/app/resultados" arrow>
            {t.emptyCta}
          </ButtonLink>
        </section>
      ) : (
        <>
          <JourneyMap
            routes={routes}
            label={t.mapLabel}
            className="rounded-md shadow-[inset_0_0_0_1px_var(--line)]"
          />
          <ol className="grid gap-px overflow-hidden rounded-md bg-line md:grid-cols-2">
            {plans.map((plan) => (
              <li key={plan.id} className="group relative grid content-start gap-4 bg-surface p-6">
                <p className="type-mono flex items-center gap-3 text-ink-muted">
                  <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">
                    {plan.pathway.country.code}
                  </span>
                  {appCopy.plan.statuses[plan.status]}
                </p>
                <Link
                  href={`/app/planos/${plan.id}`}
                  className="type-title text-[1.5rem] after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {plan.pathway.name_pt}
                </Link>
                <ProgressRoute value={plan.done} max={plan.total} label="Checklist" />
                <p className="text-[0.9375rem]">
                  <span className="type-mono text-ink-muted">{plan.next ? t.next : t.allDone}</span>
                  {plan.next && <span className="block font-semibold">{plan.next.title}</span>}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
