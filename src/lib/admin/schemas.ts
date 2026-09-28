import { z } from "@/lib/zod";
import { parseRule } from "@/lib/eligibility/rules";

// Form parsing helpers: HTML forms send strings; empty optional fields become null.
const text = (max = 500) => z.string().trim().min(1, "Obrigatório.").max(max);
const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null);
const httpsUrl = z
  .string()
  .trim()
  .url("URL inválida.")
  .refine((value) => value.startsWith("https://"), "Use uma URL oficial com https://.");
const optionalHttpsUrl = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional()
  .transform((value) => value ?? null)
  .refine((value) => value === null || /^https:\/\/\S+$/.test(value), "Use uma URL com https://.");
// Unchecked boxes are absent from FormData, hence optional().
const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal(""), z.null()])
  .optional()
  .transform((value) => value === "on" || value === "true");
const int = (min = 0) => z.coerce.number().int("Use um número inteiro.").min(min);

export const PATHWAY_CATEGORIES = ["work", "study", "residence", "working_holiday"] as const;
export const CATEGORY_LABELS: Record<(typeof PATHWAY_CATEGORIES)[number], string> = {
  work: "Trabalho",
  study: "Estudo",
  residence: "Residência",
  working_holiday: "Working holiday",
};
export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export const STATUS_LABELS: Record<(typeof CONTENT_STATUSES)[number], string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export const PathwayInput = z.object({
  country_id: z.string().uuid("Escolha o país."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens."),
  official_name: text(200),
  name_pt: text(200),
  category: z.enum(PATHWAY_CATEGORIES),
  summary_pt: text(2000),
  typical_duration_text: optionalText(200),
  leads_to_residence: checkbox,
  official_url: httpsUrl,
  points_calculator_url: optionalHttpsUrl,
  draft_reason: optionalText(2000),
});

export const RequirementInput = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, "Use letras minúsculas, números e _."),
  label_pt: text(300),
  description_pt: optionalText(2000),
  rule: z.string().transform((raw, ctx) => {
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      ctx.addIssue({ code: "custom", message: "JSON inválido." });
      return z.NEVER;
    }
    const parsed = parseRule(value);
    if (!parsed.ok) {
      ctx.addIssue({ code: "custom", message: parsed.error });
      return z.NEVER;
    }
    return parsed.rule;
  }),
  is_hard: checkbox,
  source_url: httpsUrl,
  sort_order: int(),
});

export const StepInput = z.object({
  step_order: int(1),
  title_pt: text(300),
  description_pt: optionalText(2000),
  estimated_duration_text: optionalText(200),
  source_url: httpsUrl,
});

export const DocumentInput = z.object({
  name_pt: text(300),
  description_pt: optionalText(2000),
  needs_translation: checkbox,
  needs_apostille: checkbox,
  source_url: httpsUrl,
  sort_order: int(),
});

export const CostInput = z
  .object({
    label_pt: text(300),
    amount_min: z.coerce.number().min(0, "Valor não pode ser negativo."),
    amount_max: z
      .string()
      .trim()
      .transform((value) => (value === "" ? null : Number(value)))
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .refine(
        (value) => value === null || (Number.isFinite(value) && value >= 0),
        "Valor inválido.",
      ),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use o código da moeda (ex.: AUD)."),
    is_mandatory: checkbox,
    is_estimate: checkbox,
    source_url: httpsUrl,
    sort_order: int(),
  })
  .refine((cost) => cost.amount_max === null || cost.amount_max >= cost.amount_min, {
    message: "O valor máximo deve ser maior ou igual ao mínimo.",
    path: ["amount_max"],
  });

/** Child tables editable from the pathway screen, with their input schema. */
export const CHILD_SCHEMAS = {
  requirements: RequirementInput,
  pathway_steps: StepInput,
  documents: DocumentInput,
  cost_items: CostInput,
} as const;

export type ChildTable = keyof typeof CHILD_SCHEMAS;

export function isChildTable(value: unknown): value is ChildTable {
  return typeof value === "string" && value in CHILD_SCHEMAS;
}

/** Tables whose rows carry their own last_verified_at (set on every edit). */
export const VERIFIED_CHILD_TABLES: readonly ChildTable[] = ["requirements", "cost_items"];

/** First error per field, for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
