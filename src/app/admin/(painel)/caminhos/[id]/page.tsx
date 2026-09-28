import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  deleteChild,
  markVerifiedToday,
  saveChild,
  savePathway,
  setPathwayStatus,
} from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import {
  CostFields,
  DocumentFields,
  RequirementFields,
  StepFields,
} from "@/components/admin/child-fields";
import { Select } from "@/components/admin/controls";
import { PathwayFields } from "@/components/admin/pathway-fields";
import { CONTENT_STATUSES, STATUS_LABELS, type ChildTable } from "@/lib/admin/schemas";
import { checkAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Editar caminho" };

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ChildSection<Row extends { id: string }>({
  table,
  title,
  pathwayId,
  rows,
  summary,
  renderFields,
}: {
  table: ChildTable;
  title: string;
  pathwayId: string;
  rows: Row[];
  summary: (row: Row) => ReactNode;
  renderFields: (row?: Row) => ReactNode;
}) {
  return (
    <section aria-labelledby={`section-${table}`} className="grid gap-3">
      <h2 id={`section-${table}`} className="type-eyebrow">
        {title} · {rows.length}
      </h2>
      <ul className="grid overflow-hidden rounded-md shadow-[inset_0_0_0_1px_var(--line)]">
        {rows.map((row) => (
          <li key={row.id} className="border-b border-line last:border-b-0">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 hover:bg-surface-sunk">
                <span className="min-w-0">{summary(row)}</span>
                <span aria-hidden="true" className="type-mono text-ink-muted group-open:rotate-90">
                  →
                </span>
              </summary>
              <div className="grid gap-6 border-t border-line bg-surface px-4 py-6">
                <ActionForm
                  action={saveChild.bind(null, table, pathwayId, row.id)}
                  submitLabel="Salvar"
                >
                  {renderFields(row)}
                </ActionForm>
                <ActionForm
                  action={deleteChild.bind(null, table, pathwayId, row.id)}
                  submitLabel="Remover"
                  submitVariant="ghost"
                  confirmMessage="Remover este item? A alteração fica registrada no log."
                />
              </div>
            </details>
          </li>
        ))}
        <li>
          <details>
            <summary className="type-mono cursor-pointer px-4 py-3 text-green-ink hover:bg-surface-sunk">
              + Adicionar
            </summary>
            <div className="border-t border-line bg-surface px-4 py-6">
              <ActionForm
                action={saveChild.bind(null, table, pathwayId, null)}
                submitLabel="Adicionar"
              >
                {renderFields()}
              </ActionForm>
            </div>
          </details>
        </li>
      </ul>
    </section>
  );
}

export default async function EditPathwayPage({ params }: PageProps<"/admin/caminhos/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await checkAdmin();
  const [pathwayResult, countries, requirements, steps, documents, costs] = await Promise.all([
    supabase.from("pathways").select("*").eq("id", id).maybeSingle(),
    supabase.from("countries").select("id, code, name_pt").order("code"),
    supabase.from("requirements").select("*").eq("pathway_id", id).order("sort_order"),
    supabase.from("pathway_steps").select("*").eq("pathway_id", id).order("step_order"),
    supabase.from("documents").select("*").eq("pathway_id", id).order("sort_order"),
    supabase.from("cost_items").select("*").eq("pathway_id", id).order("sort_order"),
  ]);
  const pathway = pathwayResult.data;
  if (!pathway) notFound();

  return (
    <div className="grid gap-12">
      <header className="grid gap-3">
        <Link href="/admin" className="type-mono link-route w-fit text-ink-muted">
          ← Caminhos
        </Link>
        <h1 className="type-title">{pathway.name_pt}</h1>
        <p className="type-mono text-ink-muted">
          {pathway.official_name} · v{pathway.version} · {STATUS_LABELS[pathway.status]} ·
          verificado{" "}
          {pathway.last_verified_at
            ? dateFormat.format(new Date(pathway.last_verified_at))
            : "nunca"}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section aria-labelledby="pathway-data" className="grid gap-4">
          <h2 id="pathway-data" className="type-eyebrow">
            Dados do caminho
          </h2>
          <ActionForm action={savePathway.bind(null, pathway.id)} submitLabel="Salvar caminho">
            <PathwayFields pathway={pathway} countries={countries.data ?? []} />
          </ActionForm>
        </section>

        <aside className="grid gap-6 rounded-md bg-surface-sunk p-5 lg:sticky lg:top-6">
          <div className="grid gap-3">
            <h2 className="type-eyebrow">Verificação</h2>
            <p className="text-[0.9375rem] text-ink-muted">
              Confira a página oficial e marque o caminho, os requisitos e os custos como
              verificados hoje.
            </p>
            <a
              href={pathway.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="type-mono link-inline break-all text-accent"
            >
              {pathway.official_url}
            </a>
            <ActionForm
              action={markVerifiedToday.bind(null, pathway.id)}
              submitLabel="Marcar como verificado hoje"
              submitVariant="secondary"
            />
          </div>
          <div className="grid gap-3 border-t border-line pt-5">
            <h2 className="type-eyebrow">Status</h2>
            <ActionForm
              action={setPathwayStatus.bind(null, pathway.id)}
              submitLabel="Atualizar status"
              submitVariant="secondary"
            >
              <Select
                name="status"
                label="Status do caminho"
                defaultValue={pathway.status}
                options={CONTENT_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              />
            </ActionForm>
            {pathway.draft_reason && (
              <p className="text-[0.875rem] text-(--status-info)">
                Rascunho: {pathway.draft_reason}
              </p>
            )}
          </div>
        </aside>
      </div>

      <ChildSection
        table="requirements"
        title="Requisitos"
        pathwayId={pathway.id}
        rows={requirements.data ?? []}
        summary={(row) => (
          <span className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-semibold">{row.label_pt}</span>
            <span className="type-mono text-ink-muted">
              {row.key} · {(row.rule as { op?: string }).op}
              {row.is_hard ? " · eliminatório" : ""}
            </span>
          </span>
        )}
        renderFields={(row) => <RequirementFields row={row} />}
      />
      <ChildSection
        table="pathway_steps"
        title="Etapas"
        pathwayId={pathway.id}
        rows={steps.data ?? []}
        summary={(row) => (
          <span>
            <span className="type-mono text-green-ink">{row.step_order}.</span> {row.title_pt}
          </span>
        )}
        renderFields={(row) => <StepFields row={row} />}
      />
      <ChildSection
        table="documents"
        title="Documentos"
        pathwayId={pathway.id}
        rows={documents.data ?? []}
        summary={(row) => (
          <span className="flex flex-wrap items-baseline gap-x-3">
            <span>{row.name_pt}</span>
            {row.needs_translation && <span className="type-mono text-ink-muted">tradução</span>}
            {row.needs_apostille && <span className="type-mono text-ink-muted">apostila</span>}
          </span>
        )}
        renderFields={(row) => <DocumentFields row={row} />}
      />
      <ChildSection
        table="cost_items"
        title="Custos"
        pathwayId={pathway.id}
        rows={costs.data ?? []}
        summary={(row) => (
          <span className="flex flex-wrap items-baseline gap-x-3">
            <span>{row.label_pt}</span>
            <span className="type-mono text-ink-muted">
              {row.currency} {row.amount_min}
              {row.amount_max ? `–${row.amount_max}` : ""}
              {row.is_estimate ? " · estimativa" : " · taxa oficial"}
            </span>
          </span>
        )}
        renderFields={(row) => <CostFields row={row} />}
      />
    </div>
  );
}
