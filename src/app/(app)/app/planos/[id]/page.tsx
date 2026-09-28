import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setPlanStatus, unfollowPathway } from "@/app/(app)/app/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Select } from "@/components/admin/controls";
import { ChecklistRoute, type ChecklistRow } from "@/components/app/checklist";
import { ConfirmSubmit } from "@/components/app/confirm-submit";
import { CostLedger, type ExtraRow } from "@/components/ledger/cost-ledger";
import { ProgressRoute } from "@/components/ui/progress-route";
import { ButtonLink } from "@/components/ui/button";
import { alertsCopy } from "@/content/billing";
import { todayInBrasilia } from "@/lib/app/today";
import { getEntitlements } from "@/lib/billing/plan";
import { getExchangeRates } from "@/lib/data/content";
import { appCopy } from "@/content/app";
import { requireUser } from "@/lib/data/user";

export const metadata: Metadata = { title: "Checklist" };

const t = appCopy.plan;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PlanPage({ params }: PageProps<"/app/planos/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireUser(`/app/planos/${id}`);

  const { data: plan } = await supabase
    .from("user_plans")
    .select(
      "*, pathway:pathways(id, slug, name_pt, official_name, version, official_url, country:countries(code, name_pt)), items:checklist_items(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!plan || !plan.pathway) notFound();

  const pathway = plan.pathway as unknown as {
    id: string;
    slug: string;
    name_pt: string;
    official_name: string;
    version: number;
    official_url: string;
    country: { code: string; name_pt: string };
  };
  const items = [...(plan.items ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  // Document flags come from the (public) documents table.
  const docIds = items
    .filter((i) => i.source_type === "document" && i.source_id)
    .map((i) => i.source_id!);
  const { data: docs } = docIds.length
    ? await supabase.from("documents").select("id, needs_translation").in("id", docIds)
    : { data: [] };
  const translation = new Set((docs ?? []).filter((d) => d.needs_translation).map((d) => d.id));

  const toRow = (i: (typeof items)[number]): ChecklistRow => ({
    id: i.id,
    title: i.title,
    is_done: i.is_done,
    notes: i.notes,
    due_date: i.due_date,
    needs_translation: i.source_id ? translation.has(i.source_id) : false,
  });
  const steps = items.filter((i) => i.source_type === "step").map(toRow);
  const documents = items.filter((i) => i.source_type !== "step").map(toRow);
  const done = items.filter((i) => i.is_done).length;

  const [{ isPro }, rates, costs] = await Promise.all([
    getEntitlements(supabase),
    getExchangeRates(supabase),
    supabase
      .from("cost_items")
      .select("id, label_pt, amount_min, currency, sort_order")
      .eq("pathway_id", pathway.id)
      .order("sort_order"),
  ]);
  const official = (costs.data ?? []).map((c) => {
    const rate = rates.get(c.currency);
    return {
      id: c.id,
      label: c.label_pt,
      amount: Number(c.amount_min),
      currency: c.currency,
      brl: rate ? Number(c.amount_min) * Number(rate.brl_rate) : null,
    };
  });
  const firstRate = [...rates.values()][0];
  const rateDate = firstRate
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
        new Date(firstRate.fetched_at),
      )
    : null;
  const extras = ((plan.simulator as { extras?: ExtraRow[] } | null)?.extras ?? []).slice(0, 30);

  // Pro alerts: what changed in the pathway since the person started following it.
  const { data: changes } = isPro
    ? await supabase.rpc("pathway_changes_since", {
        p_pathway: pathway.id,
        p_since: plan.created_at,
      })
    : { data: null };
  const today = todayInBrasilia();

  return (
    <div className="grid gap-12">
      <header className="grid gap-6">
        <Link href="/app/painel" className="type-mono link-route w-fit text-ink-muted">
          ← {appCopy.rail.dashboard}
        </Link>
        <p className="type-mono flex flex-wrap items-center gap-3 text-ink-muted">
          <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">
            {pathway.country.code}
          </span>
          {t.eyebrow}
        </p>
        <h1 className="type-display max-w-[18ch]">{pathway.name_pt}</h1>
        <ProgressRoute value={done} max={items.length} label="Progresso" className="max-w-xl" />
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href={`/app/caminhos/${pathway.slug}`} className="link-inline font-semibold">
            Requisitos do caminho
          </Link>
          <a
            href={pathway.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-inline font-semibold text-accent"
          >
            {t.source}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </p>
      </header>

      {pathway.version > plan.pathway_version && (
        <p
          role="status"
          className="rounded-md border-l-2 border-(--status-info) bg-(--status-info-bg) p-5 font-medium"
        >
          {t.changed}
        </p>
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <div className="grid gap-12">
          <ChecklistRoute
            planId={plan.id}
            title={t.steps}
            items={steps}
            isPro={isPro}
            today={today}
          />
          <ChecklistRoute
            planId={plan.id}
            title={t.documents}
            items={documents}
            isPro={isPro}
            today={today}
          />
          <CostLedger
            planId={plan.id}
            official={official}
            initialExtras={extras}
            isPro={isPro}
            rateDate={rateDate}
          />
          <section aria-labelledby="alerts-title" className="grid gap-4">
            <h2 id="alerts-title" className="type-eyebrow">
              {alertsCopy.title} · <span className="normal-case">{alertsCopy.since}</span>
            </h2>
            {isPro ? (
              changes && changes.length ? (
                <ol className="grid border-t border-line">
                  {changes.map((c, i) => (
                    <li
                      key={i}
                      className="type-mono flex flex-wrap gap-x-4 gap-y-1 border-b border-line py-3"
                    >
                      <span className="text-ink-muted">
                        {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
                          new Date(c.changed_at),
                        )}
                      </span>
                      <span className="font-semibold">
                        {alertsCopy.tables[c.table_name] ?? c.table_name}{" "}
                        {alertsCopy.actions[c.action] ?? c.action}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-ink-muted">{alertsCopy.none}</p>
              )
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-surface-sunk p-5">
                <p>{alertsCopy.proOnly}</p>
                <ButtonLink href="/precos" variant="secondary" arrow>
                  Ver plano Pro
                </ButtonLink>
              </div>
            )}
          </section>
        </div>

        <aside className="grid gap-6 rounded-md bg-surface-sunk p-5 lg:sticky lg:top-28">
          <ActionForm
            action={setPlanStatus.bind(null, plan.id)}
            submitLabel={t.updateStatus}
            submitVariant="secondary"
          >
            <Select
              name="status"
              label={t.status}
              defaultValue={plan.status}
              options={Object.entries(t.statuses).map(([value, label]) => ({ value, label }))}
            />
          </ActionForm>
          <form action={unfollowPathway.bind(null, plan.id)} className="border-t border-line pt-5">
            <ConfirmSubmit
              message={t.unfollowConfirm}
              variant="ghost"
              className="px-0 text-(--status-fails)"
            >
              {t.unfollow}
            </ConfirmSubmit>
          </form>
        </aside>
      </div>
    </div>
  );
}
