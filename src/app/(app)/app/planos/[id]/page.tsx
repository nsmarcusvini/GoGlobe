import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setPlanStatus, unfollowPathway } from "@/app/(app)/app/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Select } from "@/components/admin/controls";
import { ChecklistRoute, type ChecklistRow } from "@/components/app/checklist";
import { ConfirmSubmit } from "@/components/app/confirm-submit";
import { ProgressRoute } from "@/components/ui/progress-route";
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
    needs_translation: i.source_id ? translation.has(i.source_id) : false,
  });
  const steps = items.filter((i) => i.source_type === "step").map(toRow);
  const documents = items.filter((i) => i.source_type !== "step").map(toRow);
  const done = items.filter((i) => i.is_done).length;

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
          <ChecklistRoute planId={plan.id} title={t.steps} items={steps} />
          <ChecklistRoute planId={plan.id} title={t.documents} items={documents} />
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
