import { CATEGORY_LABELS, PATHWAY_CATEGORIES } from "@/lib/admin/schemas";
import type { Database } from "@/lib/database.types";
import { Checkbox, Select, TextArea, TextField } from "./controls";

type Pathway = Database["public"]["Tables"]["pathways"]["Row"];
type Country = Pick<Database["public"]["Tables"]["countries"]["Row"], "id" | "code" | "name_pt">;

/** Pathway form fields (create and edit). */
export function PathwayFields({ pathway, countries }: { pathway?: Pathway; countries: Country[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Select
        name="country_id"
        label="País"
        defaultValue={pathway?.country_id}
        options={countries.map((c) => ({ value: c.id, label: `${c.name_pt} (${c.code})` }))}
      />
      <Select
        name="category"
        label="Categoria"
        defaultValue={pathway?.category}
        options={PATHWAY_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
      />
      <TextField
        name="official_name"
        label="Nome oficial"
        hint="Exatamente como na página do governo."
        defaultValue={pathway?.official_name}
        required
      />
      <TextField
        name="name_pt"
        label="Nome em português"
        defaultValue={pathway?.name_pt}
        required
      />
      <TextField
        name="slug"
        label="Slug (URL)"
        hint="Letras minúsculas, números e hífens."
        defaultValue={pathway?.slug}
        required
      />
      <TextField
        name="typical_duration_text"
        label="Duração típica"
        defaultValue={pathway?.typical_duration_text ?? ""}
      />
      <TextArea
        name="summary_pt"
        label="Resumo em português"
        hint="Descreva o que é publicado. Sem recomendação, sem promessa."
        defaultValue={pathway?.summary_pt}
        className="md:col-span-2"
        required
      />
      <TextField
        name="official_url"
        type="url"
        label="Página oficial"
        defaultValue={pathway?.official_url}
        required
      />
      <TextField
        name="points_calculator_url"
        type="url"
        label="Calculadora oficial de pontos (opcional)"
        defaultValue={pathway?.points_calculator_url ?? ""}
      />
      <TextArea
        name="draft_reason"
        label="Motivo do rascunho (interno)"
        hint="O que ainda não foi possível verificar."
        rows={2}
        defaultValue={pathway?.draft_reason ?? ""}
        className="md:col-span-2"
      />
      <Checkbox
        name="leads_to_residence"
        label="Pode levar à residência permanente (segundo a fonte oficial)"
        defaultChecked={pathway?.leads_to_residence}
      />
    </div>
  );
}
