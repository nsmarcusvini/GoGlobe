import { z } from "@/lib/zod";

// Validation for each onboarding answer. Every schema returns the partial
// `profiles` update for that question. Empty strings mean "no answer" (null).

const nullIfEmpty = (value: unknown) => (value === "" || value === undefined ? null : value);

const today = () => new Date().toISOString().slice(0, 10);

const birthDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato dia/mês/ano.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Data inválida.")
  .refine((value) => value <= today(), "A data não pode estar no futuro.")
  .refine((value) => value >= "1900-01-02", "Data inválida.");

const decimal = (min: number, max: number) =>
  z.preprocess(
    (value) => {
      const cleaned = nullIfEmpty(
        typeof value === "string" ? value.replace(",", ".").trim() : value,
      );
      return cleaned === null ? null : Number(cleaned);
    },
    z
      .number("Informe um número.")
      .min(min, `Use um valor a partir de ${min}.`)
      .max(max, `Use um valor até ${max}.`)
      .nullable(),
  );

const money = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/[^\d,]/g, "").replace(",", ".");
  return digits === "" ? null : Number(digits);
}, z.number("Informe um valor.").min(0, "O valor não pode ser negativo.").max(1e9, "Valor muito alto.").nullable());

export const ANSWER_SCHEMAS = {
  birth_date: z.object({ birth_date: birthDate }),
  marital_status: z.object({
    marital_status: z.enum(["single", "married", "stable_union", "divorced", "widowed"]),
  }),
  has_children: z.object({
    has_children: z.enum(["true", "false"]).transform((value) => value === "true"),
  }),
  goal: z.object({ goal: z.enum(["work", "study", "residence"]) }),
  target_countries: z.object({
    target_countries: z.array(z.enum(["AU", "NZ", "CA"])).min(1, "Escolha pelo menos um país."),
  }),
  education_level: z.object({
    education_level: z.enum([
      "none",
      "high_school",
      "technical",
      "bachelor",
      "postgraduate",
      "master",
      "doctorate",
    ]),
  }),
  occupation_text: z.object({
    occupation_text: z.string().trim().min(2, "Descreva sua profissão.").max(200),
  }),
  years_experience: z
    .object({ years_experience: decimal(0, 60) })
    .refine((value) => value.years_experience !== null, {
      message: "Informe os anos de experiência (use 0 se não tiver).",
      path: ["years_experience"],
    }),
  english_level: z.object({
    english_level: z.enum(["none", "basic", "intermediate", "advanced", "fluent"]),
  }),
  english_test: z
    .object({
      english_test: z.preprocess(
        nullIfEmpty,
        z.enum(["IELTS", "PTE", "TOEFL", "CELPIP", "Duolingo"]).nullable(),
      ),
      english_score: decimal(0, 200),
      english_lowest_component: decimal(0, 200),
    })
    .transform((value) =>
      // No test: clear the scores so the profile stays consistent.
      value.english_test === null
        ? { english_test: null, english_score: null, english_lowest_component: null }
        : value,
    )
    .refine((value) => value.english_test === null || value.english_score !== null, {
      message: "Informe a nota geral do teste.",
      path: ["english_score"],
    })
    .refine(
      (value) =>
        value.english_lowest_component === null ||
        value.english_score === null ||
        value.english_lowest_component <= value.english_score + 1.5,
      {
        message: "Confira a menor nota: ela costuma ficar abaixo da geral.",
        path: ["english_lowest_component"],
      },
    ),
  budget_brl: z.object({ budget_brl: money }).refine((value) => value.budget_brl !== null, {
    message: "Informe um valor aproximado.",
    path: ["budget_brl"],
  }),
} as const;

export type QuestionId = keyof typeof ANSWER_SCHEMAS;

export function isQuestionId(value: unknown): value is QuestionId {
  return typeof value === "string" && value in ANSWER_SCHEMAS;
}

/** Reads a FormData into the shape the schema expects (multi-selects as arrays). */
export function answerInput(questionId: QuestionId, formData: FormData): Record<string, unknown> {
  if (questionId === "target_countries") {
    return { target_countries: formData.getAll("target_countries").map(String) };
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) out[key] = value;
  }
  return out;
}
