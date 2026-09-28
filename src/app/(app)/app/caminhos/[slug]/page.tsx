import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { followPathway } from "@/app/(app)/app/actions";
import { RequirementTrack } from "@/components/app/requirement-track";
import { AssistantAction } from "@/components/assistant/assistant-drawer";
import { Dossier } from "@/components/dossier/dossier";
import { Button, ButtonLink } from "@/components/ui/button";
import { appCopy } from "@/content/app";
import { assistantCopy } from "@/content/assistant";
import { aiEnabled } from "@/lib/ai/server";
import { todayInBrasilia } from "@/lib/app/today";
import { getExchangeRates, getPathwayDetailBySlug, toEngineInput } from "@/lib/data/content";
import { requireUser } from "@/lib/data/user";
import { evaluatePathway, profileFromRow } from "@/lib/eligibility";

export const metadata: Metadata = { title: "Caminho" };

const t = appCopy.pathway;

export default async function AppPathwayPage({ params }: PageProps<"/app/caminhos/[slug]">) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound();
  const { supabase, profile } = await requireUser(`/app/caminhos/${slug}`);

  const [pathway, rates] = await Promise.all([
    getPathwayDetailBySlug(supabase, slug),
    getExchangeRates(supabase),
  ]);
  if (!pathway) notFound();

  const { data: plan } = await supabase
    .from("user_plans")
    .select("id")
    .eq("pathway_id", pathway.id)
    .maybeSingle();

  const evaluation = evaluatePathway(toEngineInput(pathway), profileFromRow(profile), {
    today: todayInBrasilia(),
  });
  const results = new Map(evaluation.results.map((r) => [r.key, r]));
  const s = evaluation.summary;

  return (
    <Dossier
      pathway={pathway}
      rates={rates}
      results={results}
      compact
      breadcrumb={
        <Link href="/app/resultados" className="type-mono link-route w-fit text-ink-muted">
          ← {t.back}
        </Link>
      }
      actions={
        <div className="grid gap-5 rounded-md bg-surface-sunk p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
          <div className="grid gap-3">
            <p className="type-eyebrow">{t.yourStatus}</p>
            <RequirementTrack results={evaluation.results} className="max-w-md" />
            <p className="type-mono text-ink-muted">
              {s.meets} atende · {s.doesNotMeet} não atende ({s.hardFailures.length} eliminatório) ·{" "}
              {s.insufficientInfo} falta informação · {s.manualCheck} verificar
            </p>
            {aiEnabled() && (
              <div>
                <AssistantAction
                  request={{ action: "summary", slug: pathway.slug, name: pathway.name_pt }}
                >
                  {assistantCopy.actions.summary}
                </AssistantAction>
              </div>
            )}
          </div>
          {plan ? (
            <ButtonLink href={`/app/planos/${plan.id}`} variant="secondary" arrow>
              {t.openPlan}
            </ButtonLink>
          ) : (
            <form action={followPathway.bind(null, pathway.id)}>
              <Button type="submit" arrow>
                {t.follow}
              </Button>
            </form>
          )}
        </div>
      }
    />
  );
}
