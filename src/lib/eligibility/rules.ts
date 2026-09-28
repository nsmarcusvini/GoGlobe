import { z } from "../zod.ts";

// Vocabulary shared with the database enums (supabase/migrations/*_foundation.sql).
// Order matters: lowest to highest. The Phase 4 engine compares positions.
export const ENGLISH_LEVELS = ["none", "basic", "intermediate", "advanced", "fluent"] as const;
export const ENGLISH_TESTS = ["IELTS", "PTE", "TOEFL", "CELPIP", "Duolingo"] as const;
export const EDUCATION_LEVELS = [
  "none",
  "high_school",
  "technical",
  "bachelor",
  "postgraduate",
  "master",
  "doctorate",
] as const;
export const USER_GOALS = ["work", "study", "residence"] as const;

const EnglishLevel = z.enum(ENGLISH_LEVELS);
const EnglishTest = z.enum(ENGLISH_TESTS);
const EducationLevel = z.enum(EDUCATION_LEVELS);
const UserGoal = z.enum(USER_GOALS);

const age = z.number().int().min(0).max(120);

/** Maximum age, inclusive. "Under 45" is `{ op: "age_max", value: 44 }`. */
const AgeMax = z.object({ op: z.literal("age_max"), value: age }).strict();
/** Minimum age, inclusive. */
const AgeMin = z.object({ op: z.literal("age_min"), value: age }).strict();

/**
 * Official test threshold. `scope` says how the government applies it:
 * - "overall": minimum overall/average score (compared with profiles.english_score);
 * - "each_component": minimum in every skill (compared with the lowest skill score,
 *   profiles.english_lowest_component).
 * Only encode tests whose threshold is the same across skills; list the rest in
 * the requirement description with the official table link.
 */
const EnglishTestThreshold = z
  .object({
    test: EnglishTest,
    min_score: z.number().min(0),
    scope: z.enum(["overall", "each_component"]),
  })
  .strict();

/**
 * Minimum English. Met by any listed official test threshold, or (only where the
 * program itself accepts it) by a self-declared `level`.
 */
const EnglishMin = z
  .object({
    op: z.literal("english_min"),
    level: EnglishLevel.optional(),
    tests: z.array(EnglishTestThreshold).min(1).optional(),
  })
  .strict()
  .refine((rule) => rule.level !== undefined || rule.tests !== undefined, {
    message: "Informe `level` ou `tests`.",
  });

const EducationMin = z.object({ op: z.literal("education_min"), level: EducationLevel }).strict();

const ExperienceMin = z
  .object({ op: z.literal("experience_min_years"), value: z.number().min(0).max(60) })
  .strict();

const BudgetMin = z
  .object({ op: z.literal("budget_min_brl"), value: z.number().positive() })
  .strict();

/** Occupation must be on a named list (`occupations.list_name`) of the pathway's country. */
const OccupationInList = z
  .object({ op: z.literal("occupation_in_list"), list: z.string().min(1) })
  .strict();

const GoalIn = z.object({ op: z.literal("goal_in"), goals: z.array(UserGoal).min(1) }).strict();

/** Cannot be assessed automatically (job offer, police certificate...). */
const Manual = z.object({ op: z.literal("manual"), reason: z.string().min(1).optional() }).strict();

export const RequirementRule = z.discriminatedUnion("op", [
  AgeMax,
  AgeMin,
  EnglishMin,
  EducationMin,
  ExperienceMin,
  BudgetMin,
  OccupationInList,
  GoalIn,
  Manual,
]);

export type RequirementRule = z.infer<typeof RequirementRule>;
export type RuleOp = RequirementRule["op"];

export const RULE_OPS = [
  "age_max",
  "age_min",
  "english_min",
  "education_min",
  "experience_min_years",
  "budget_min_brl",
  "occupation_in_list",
  "goal_in",
  "manual",
] as const satisfies readonly RuleOp[];

/** Parses an unknown JSON value into a rule, with pt-BR error messages. */
export function parseRule(
  value: unknown,
): { ok: true; rule: RequirementRule } | { ok: false; error: string } {
  const result = RequirementRule.safeParse(value);
  if (result.success) return { ok: true, rule: result.data };
  return {
    ok: false,
    error: result.error.issues
      .map((issue) => `${issue.path.join(".") || "regra"}: ${issue.message}`)
      .join("; "),
  };
}
