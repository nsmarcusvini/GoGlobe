import type { Database } from "@/lib/database.types";
import { Checkbox, TextArea, TextField } from "./controls";
import { RuleEditor } from "./rule-editor";

type Tables = Database["public"]["Tables"];

export function RequirementFields({ row }: { row?: Tables["requirements"]["Row"] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField
        name="key"
        label="Chave"
        hint="Ex.: age, english."
        defaultValue={row?.key}
        required
      />
      <TextField
        name="sort_order"
        type="number"
        label="Ordem"
        defaultValue={row?.sort_order ?? 0}
      />
      <TextField
        name="label_pt"
        label="Rótulo"
        defaultValue={row?.label_pt}
        className="md:col-span-2"
        required
      />
      <TextArea
        name="description_pt"
        label="Descrição"
        rows={3}
        defaultValue={row?.description_pt ?? ""}
        className="md:col-span-2"
      />
      <div className="md:col-span-2">
        <RuleEditor defaultValue={row ? JSON.stringify(row.rule) : ""} />
      </div>
      <TextField
        name="source_url"
        type="url"
        label="Fonte oficial"
        defaultValue={row?.source_url}
        className="md:col-span-2"
        required
      />
      <Checkbox name="is_hard" label="Eliminatório" defaultChecked={row?.is_hard} />
    </div>
  );
}

export function StepFields({ row }: { row?: Tables["pathway_steps"]["Row"] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField
        name="step_order"
        type="number"
        min={1}
        label="Ordem"
        defaultValue={row?.step_order ?? 1}
        required
      />
      <TextField
        name="estimated_duration_text"
        label="Duração estimada"
        defaultValue={row?.estimated_duration_text ?? ""}
      />
      <TextField
        name="title_pt"
        label="Título"
        defaultValue={row?.title_pt}
        className="md:col-span-2"
        required
      />
      <TextArea
        name="description_pt"
        label="Descrição"
        rows={3}
        defaultValue={row?.description_pt ?? ""}
        className="md:col-span-2"
      />
      <TextField
        name="source_url"
        type="url"
        label="Fonte oficial"
        defaultValue={row?.source_url}
        className="md:col-span-2"
        required
      />
    </div>
  );
}

export function DocumentFields({ row }: { row?: Tables["documents"]["Row"] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField name="name_pt" label="Documento" defaultValue={row?.name_pt} required />
      <TextField
        name="sort_order"
        type="number"
        label="Ordem"
        defaultValue={row?.sort_order ?? 0}
      />
      <TextArea
        name="description_pt"
        label="Descrição"
        rows={2}
        defaultValue={row?.description_pt ?? ""}
        className="md:col-span-2"
      />
      <TextField
        name="source_url"
        type="url"
        label="Fonte oficial"
        defaultValue={row?.source_url}
        className="md:col-span-2"
        required
      />
      <Checkbox
        name="needs_translation"
        label="Precisa de tradução (documento brasileiro)"
        defaultChecked={row?.needs_translation}
      />
      <Checkbox
        name="needs_apostille"
        label="Precisa de apostilamento"
        defaultChecked={row?.needs_apostille}
      />
    </div>
  );
}

export function CostFields({ row }: { row?: Tables["cost_items"]["Row"] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <TextField
        name="label_pt"
        label="Descrição do custo"
        defaultValue={row?.label_pt}
        className="md:col-span-3"
        required
      />
      <TextField
        name="amount_min"
        type="number"
        step="0.01"
        min={0}
        label="Valor (mínimo)"
        defaultValue={row?.amount_min}
        required
      />
      <TextField
        name="amount_max"
        type="number"
        step="0.01"
        min={0}
        label="Valor máximo (opcional)"
        defaultValue={row?.amount_max ?? ""}
      />
      <TextField
        name="currency"
        label="Moeda"
        hint="AUD, NZD, CAD…"
        defaultValue={row?.currency}
        required
      />
      <TextField
        name="source_url"
        type="url"
        label="Fonte oficial"
        defaultValue={row?.source_url}
        className="md:col-span-2"
        required
      />
      <TextField
        name="sort_order"
        type="number"
        label="Ordem"
        defaultValue={row?.sort_order ?? 0}
      />
      <Checkbox
        name="is_mandatory"
        label="Obrigatório"
        defaultChecked={row?.is_mandatory ?? true}
      />
      <Checkbox
        name="is_estimate"
        label="Estimativa (não é taxa oficial)"
        defaultChecked={row?.is_estimate}
      />
    </div>
  );
}
