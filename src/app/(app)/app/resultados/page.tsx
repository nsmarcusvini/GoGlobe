import type { Metadata } from "next";
import Link from "next/link";
import { RequirementTrack, TrackLegend } from "@/components/app/requirement-track";
import { JourneyMap } from "@/components/map/journey-map";
import type { RouteCode } from "@/components/map/routes";
import { ButtonLink } from "@/components/ui/button";
import { appCopy } from "@/content/app";
import { todayInBrasilia } from "@/lib/app/today";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/cn";
import { appPathwayHref, listPathways, toEngineInput } from "@/lib/data/content";
import { requireUser } from "@/lib/data/user";
import {
  evaluateAll,
  hasCompatibleRequirements,
  profileFromRow,
  SORT_CRITERION_LABEL,
} from "@/lib/eligibility";

export const metadata: Metadata = { title: "Resultados" };

const t = appCopy.results;
const COUNTRY_NAMES: Record<string, string> = {
  AU: "Austrália",
  NZ: "Nova Zelândia",
  CA: "Canadá",
};

export default async function ResultsPage({ searchParams }: PageProps<"/app/resultados">) {
  const params = await searchParams;
  const { supabase, user, profile } = await requireUser("/app/resultados");
  await track("results_viewed", { userId: user.id });
  const [pathways, plans] = await Promise.all([
    listPathways(supabase),
    supabase.from("user_plans").select("pathway_id"),
  ]);
  const followed = new Set((plans.data ?? []).map((p) => p.pathway_id));

  const targets = profile.target_countries;
  const showAll = params.todos === "1" || targets.length === 0;
  const visible = showAll ? pathways : pathways.filter((p) => targets.includes(p.country.code));
  const byId = new Map(visible.map((p) => [p.id, p]));

  const results = evaluateAll(visible.map(toEngineInput), profileFromRow(profile), {
    today: todayInBrasilia(),
  });
  const compatible = results.filter(hasCompatibleRequirements).length;
  const countries = [...new Set(results.map((r) => r.countryCode))];

  return (
    <div className="grid gap-12">
      <header className="grid gap-5">
        <p className="type-eyebrow">{t.eyebrow}</p>
        <h1 className="type-display max-w-[16ch]">{t.title}</h1>
        <p className="type-lead">{t.lead}</p>
      </header>

      {!profile.onboarding_completed_at && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-4 rounded-md border-l-2 border-(--status-info) bg-(--status-info-bg) p-5"
        >
          <p className="font-medium">{t.incomplete}</p>
          <ButtonLink href="/app/onboarding" variant="secondary">
            {t.completeProfile}
          </ButtonLink>
        </div>
      )}

      <section
        aria-label="Resumo"
        className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end"
      >
        <JourneyMap
          routes={countries
            .filter((c): c is RouteCode => c in COUNTRY_NAMES)
            .map((code) => ({ code }))}
          label={t.mapLabel(countries.map((c) => COUNTRY_NAMES[c] ?? c).join(", "))}
          className="rounded-md shadow-[inset_0_0_0_1px_var(--line)]"
        />
        <div className="grid gap-4">
          <p className="type-title text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)]">
            {t.compatible(compatible, results.length)}
          </p>
          <p className="text-ink-muted">{t.compatibleHint}</p>
          {targets.length > 0 && (
            <Link
              href={showAll ? "/app/resultados" : "/app/resultados?todos=1"}
              className="link-inline w-fit font-semibold"
            >
              {showAll ? t.showTargets : t.showAll}
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="legs-title" className="grid gap-6">
        <div className="grid gap-3 border-y border-line py-4">
          <h2 id="legs-title" className="sr-only">
            Caminhos
          </h2>
          <TrackLegend />
          <p className="type-mono text-ink-muted">{SORT_CRITERION_LABEL}</p>
        </div>

        {results.length === 0 && <p className="text-ink-muted">{t.empty}</p>}

        {countries.map((code) => (
          <div key={code} className="grid gap-2">
            <h3 className="type-eyebrow">{COUNTRY_NAMES[code] ?? code}</h3>
            <ol className="grid">
              {results
                .filter((r) => r.countryCode === code)
                .map((result) => {
                  const pathway = byId.get(result.pathwayId)!;
                  const hard = result.summary.hardFailures.length;
                  return (
                    <li key={result.pathwayId} className="group relative border-b border-line">
                      <div className="grid gap-3 py-5 md:grid-cols-[minmax(0,1.3fr)_minmax(8rem,1fr)_auto] md:items-center md:gap-8">
                        <div className="grid gap-1">
                          <Link
                            href={appPathwayHref(pathway)}
                            className="text-lg leading-snug font-semibold after:absolute after:inset-0 focus-visible:outline-none"
                          >
                            {pathway.name_pt}
                          </Link>
                          <span className="type-mono text-ink-muted">
                            {pathway.official_name}
                            {followed.has(pathway.id) && (
                              <span className="text-green-ink"> · acompanhando</span>
                            )}
                          </span>
                        </div>
                        <RequirementTrack results={result.results} className="max-w-xs" />
                        <div className="flex items-center justify-between gap-4 md:justify-end">
                          <span
                            className={cn(
                              "type-mono",
                              hard ? "text-(--status-fails)" : "text-ink-muted",
                            )}
                          >
                            {t.hardFailures(hard)}
                          </span>
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 12"
                            className="h-3 w-6 shrink-0 text-route transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5"
                          >
                            <path
                              d="M0 6h22M17 1l5 5-5 5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                          </svg>
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ol>
          </div>
        ))}
      </section>
    </div>
  );
}
