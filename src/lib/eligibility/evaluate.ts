// Eligibility engine: compares a profile with published criteria.
// Pure and deterministic (the reference date is an argument), auditable, no AI.
// It never ranks pathways by "fit" or recommends one: see sortPathways().

import { EDUCATION_LEVELS, ENGLISH_LEVELS, parseRule, type RequirementRule } from "./rules.ts";
import type {
  EligibilityProfile,
  EvaluationContext,
  PathwayInput,
  PathwayResult,
  PathwaySummary,
  RequirementInput,
  RequirementResult,
  RequirementStatus,
} from "./types.ts";

type Verdict = { status: RequirementStatus; reason: string };

const ENGLISH_LEVEL_LABELS: Record<(typeof ENGLISH_LEVELS)[number], string> = {
  none: "nenhum",
  basic: "básico",
  intermediate: "intermediário",
  advanced: "avançado",
  fluent: "fluente",
};

const EDUCATION_LABELS: Record<(typeof EDUCATION_LEVELS)[number], string> = {
  none: "sem escolaridade formal",
  high_school: "ensino médio",
  technical: "técnico",
  bachelor: "graduação",
  postgraduate: "pós-graduação (especialização)",
  master: "mestrado",
  doctorate: "doutorado",
};

const GOAL_LABELS = { work: "trabalho", study: "estudo", residence: "residência" } as const;

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

// ------------------------------------------------------------------ dates ---

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // Round-trip through UTC to reject impossible dates such as 2026-02-30.
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

/**
 * Age in whole years on `today`. Calendar-based (no time zones involved).
 * Someone born on 29 Feb has their birthday on 1 Mar in non-leap years.
 * Returns null for invalid dates or a birth date after `today`.
 */
export function ageOn(birthDate: string, today: string): number | null {
  const birth = parseIsoDate(birthDate);
  const ref = parseIsoDate(today);
  if (!birth || !ref) return null;
  let age = ref.y - birth.y;
  const birthdayPassed = ref.m > birth.m || (ref.m === birth.m && ref.d >= birth.d);
  if (!birthdayPassed) age -= 1;
  return age < 0 ? null : age;
}

// ------------------------------------------------------------ requirement ---

function evaluateRule(
  rule: RequirementRule,
  profile: EligibilityProfile,
  ctx: EvaluationContext,
): Verdict {
  switch (rule.op) {
    case "age_max":
    case "age_min": {
      if (!profile.birthDate) {
        return { status: "insufficient_info", reason: "Informe sua data de nascimento." };
      }
      const age = ageOn(profile.birthDate, ctx.today);
      if (age === null) {
        return {
          status: "insufficient_info",
          reason: "A data de nascimento informada é inválida.",
        };
      }
      const ok = rule.op === "age_max" ? age <= rule.value : age >= rule.value;
      const limit =
        rule.op === "age_max" ? `máximo de ${rule.value} anos` : `mínimo de ${rule.value} anos`;
      return {
        status: ok ? "meets" : "does_not_meet",
        reason: `Você tem ${age} anos hoje; o critério é ${limit}.`,
      };
    }

    case "english_min":
      return evaluateEnglish(rule, profile);

    case "education_min": {
      if (!profile.educationLevel) {
        return { status: "insufficient_info", reason: "Informe sua escolaridade." };
      }
      const ok =
        EDUCATION_LEVELS.indexOf(profile.educationLevel) >= EDUCATION_LEVELS.indexOf(rule.level);
      return {
        status: ok ? "meets" : "does_not_meet",
        reason: `Você informou ${EDUCATION_LABELS[profile.educationLevel]}; o mínimo é ${EDUCATION_LABELS[rule.level]}.`,
      };
    }

    case "experience_min_years": {
      if (profile.yearsExperience === null) {
        return { status: "insufficient_info", reason: "Informe seus anos de experiência." };
      }
      const ok = profile.yearsExperience >= rule.value;
      return {
        status: ok ? "meets" : "does_not_meet",
        reason: `Você informou ${number.format(profile.yearsExperience)} ano(s) de experiência; o mínimo é ${number.format(rule.value)}.`,
      };
    }

    case "budget_min_brl": {
      if (profile.budgetBrl === null) {
        return { status: "insufficient_info", reason: "Informe seu orçamento." };
      }
      const ok = profile.budgetBrl >= rule.value;
      return {
        status: ok ? "meets" : "does_not_meet",
        reason: `Você informou ${brl.format(profile.budgetBrl)}; o mínimo de referência é ${brl.format(rule.value)}.`,
      };
    }

    case "occupation_in_list": {
      if (profile.occupationLists === null) {
        return {
          status: "insufficient_info",
          reason: `Não sabemos se sua ocupação está na lista ${rule.list}. Confira na lista oficial.`,
        };
      }
      const ok = profile.occupationLists.includes(rule.list);
      return {
        status: ok ? "meets" : "does_not_meet",
        reason: ok
          ? `Sua ocupação consta na lista ${rule.list}.`
          : `Sua ocupação não consta na lista ${rule.list}.`,
      };
    }

    case "goal_in": {
      if (!profile.goal) {
        return { status: "insufficient_info", reason: "Informe seu objetivo." };
      }
      const ok = rule.goals.includes(profile.goal);
      return {
        status: ok ? "meets" : "does_not_meet",
        reason: `Seu objetivo informado é ${GOAL_LABELS[profile.goal]}; este caminho é para ${rule.goals.map((g) => GOAL_LABELS[g]).join(" ou ")}.`,
      };
    }

    case "manual":
      return {
        status: "manual_check",
        reason: rule.reason
          ? `${rule.reason}. Confira na fonte oficial.`
          : "Não dá para avaliar automaticamente. Confira na fonte oficial.",
      };
  }
}

function evaluateEnglish(
  rule: Extract<RequirementRule, { op: "english_min" }>,
  profile: EligibilityProfile,
): Verdict {
  // 1) An official test the rule knows how to compare.
  if (profile.englishTest && rule.tests) {
    const threshold = rule.tests.find((t) => t.test === profile.englishTest);
    if (threshold) {
      const score =
        threshold.scope === "overall" ? profile.englishScore : profile.englishLowestComponent;
      const what =
        threshold.scope === "overall" ? "nota geral" : "menor nota entre as 4 habilidades";
      if (score === null) {
        return {
          status: "insufficient_info",
          reason: `Informe a ${what} do seu ${profile.englishTest}.`,
        };
      }
      const ok = score >= threshold.min_score;
      return {
        status: ok ? "meets" : "does_not_meet",
        reason: `Sua ${what} no ${profile.englishTest} é ${number.format(score)}; o mínimo é ${number.format(threshold.min_score)}.`,
      };
    }
  }

  // 2) Self-declared level, only where the rule itself accepts a level.
  if (rule.level) {
    if (!profile.englishLevel) {
      return { status: "insufficient_info", reason: "Informe seu nível de inglês." };
    }
    const ok = ENGLISH_LEVELS.indexOf(profile.englishLevel) >= ENGLISH_LEVELS.indexOf(rule.level);
    return {
      status: ok ? "meets" : "does_not_meet",
      reason: `Você informou nível ${ENGLISH_LEVEL_LABELS[profile.englishLevel]}; o mínimo é ${ENGLISH_LEVEL_LABELS[rule.level]}.`,
    };
  }

  const accepted = (rule.tests ?? []).map((t) => t.test).join(", ");
  // 3) The user has a test we can't compare (e.g. Duolingo where only IELTS/CELPIP are encoded).
  if (profile.englishTest) {
    return {
      status: "manual_check",
      reason: `Comparamos automaticamente apenas ${accepted}. Confira na tabela oficial se o ${profile.englishTest} é aceito e qual nota é exigida.`,
    };
  }
  // 4) No test yet: this requirement asks for an official test result.
  return {
    status: "insufficient_info",
    reason: `Este requisito pede resultado de teste oficial (por exemplo ${accepted}). Informe seu teste e suas notas.`,
  };
}

/** Evaluates one requirement. Invalid stored rules become a manual check, never a crash. */
export function evaluateRequirement(
  requirement: RequirementInput,
  profile: EligibilityProfile,
  ctx: EvaluationContext,
): RequirementResult {
  const base = { key: requirement.key, label: requirement.label, isHard: requirement.isHard };
  const parsed = parseRule(requirement.rule);
  if (!parsed.ok) {
    return {
      ...base,
      status: "manual_check",
      reason: "Não conseguimos avaliar este requisito automaticamente. Confira na fonte oficial.",
      invalidRule: true,
    };
  }
  return { ...base, ...evaluateRule(parsed.rule, profile, ctx) };
}

// ---------------------------------------------------------------- pathway ---

export function summarize(results: RequirementResult[]): PathwaySummary {
  const keysWhere = (predicate: (r: RequirementResult) => boolean) =>
    results.filter(predicate).map((r) => r.key);
  return {
    total: results.length,
    meets: results.filter((r) => r.status === "meets").length,
    doesNotMeet: results.filter((r) => r.status === "does_not_meet").length,
    insufficientInfo: results.filter((r) => r.status === "insufficient_info").length,
    manualCheck: results.filter((r) => r.status === "manual_check").length,
    hardFailures: keysWhere((r) => r.isHard && r.status === "does_not_meet"),
    manualKeys: keysWhere((r) => r.status === "manual_check"),
    missingInfoKeys: keysWhere((r) => r.status === "insufficient_info"),
    invalidRuleKeys: keysWhere((r) => r.invalidRule === true),
  };
}

export function evaluatePathway(
  pathway: PathwayInput,
  profile: EligibilityProfile,
  ctx: EvaluationContext,
): PathwayResult {
  const results = pathway.requirements.map((r) => evaluateRequirement(r, profile, ctx));
  return {
    pathwayId: pathway.id,
    slug: pathway.slug,
    name: pathway.name,
    countryCode: pathway.countryCode,
    results,
    summary: summarize(results),
  };
}

/** True when no eliminatory requirement is known to be unmet (the "compatible" wording). */
export function hasCompatibleRequirements(result: PathwayResult): boolean {
  return result.summary.hardFailures.length === 0;
}

export const DEFAULT_COUNTRY_ORDER = ["AU", "NZ", "CA"] as const;

/** Explains the ordering in the UI: organisation, not recommendation. */
export const SORT_CRITERION_LABEL =
  "Organizado por país e, dentro de cada país, pelo número de requisitos eliminatórios não atendidos (menos primeiro). Isso é só um critério de organização, não uma recomendação.";

/**
 * Orders results by country, then by number of unmet eliminatory requirements
 * (fewest first), then by name. There is deliberately no "best pathway" score.
 */
export function sortPathways(
  results: PathwayResult[],
  countryOrder: readonly string[] = DEFAULT_COUNTRY_ORDER,
): PathwayResult[] {
  const countryRank = (code: string) => {
    const index = countryOrder.indexOf(code);
    return index === -1 ? countryOrder.length : index;
  };
  return [...results].sort(
    (a, b) =>
      countryRank(a.countryCode) - countryRank(b.countryCode) ||
      a.countryCode.localeCompare(b.countryCode) ||
      a.summary.hardFailures.length - b.summary.hardFailures.length ||
      a.name.localeCompare(b.name, "pt-BR"),
  );
}

/** Convenience: evaluate every pathway and return them in display order. */
export function evaluateAll(
  pathways: PathwayInput[],
  profile: EligibilityProfile,
  ctx: EvaluationContext,
  countryOrder?: readonly string[],
): PathwayResult[] {
  return sortPathways(
    pathways.map((p) => evaluatePathway(p, profile, ctx)),
    countryOrder,
  );
}
