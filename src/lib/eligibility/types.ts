// Eligibility engine types. Pure data: no database, no I/O.
// Relative ".ts" imports keep this module runnable from Node scripts too.
import type { EDUCATION_LEVELS, ENGLISH_LEVELS, ENGLISH_TESTS, USER_GOALS } from "./rules.ts";

export type RequirementStatus = "meets" | "does_not_meet" | "insufficient_info" | "manual_check";

export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];
export type EnglishTest = (typeof ENGLISH_TESTS)[number];
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export type UserGoal = (typeof USER_GOALS)[number];

/** What the user told us. Every field may be missing (onboarding is incremental). */
export type EligibilityProfile = {
  /** ISO date, YYYY-MM-DD. */
  birthDate: string | null;
  educationLevel: EducationLevel | null;
  yearsExperience: number | null;
  englishLevel: EnglishLevel | null;
  englishTest: EnglishTest | null;
  /** Overall / average score in the test's own scale. */
  englishScore: number | null;
  /** Lowest of the four skill scores, for per-skill minimums. */
  englishLowestComponent: number | null;
  budgetBrl: number | null;
  goal: UserGoal | null;
  /**
   * Names of the official occupation lists that contain the user's occupation.
   * null = we don't know (occupation not informed or not mapped to a list).
   */
  occupationLists: string[] | null;
};

export type EvaluationContext = {
  /** Reference date (ISO YYYY-MM-DD) used for ages. Passed in, never read from the clock. */
  today: string;
};

export type RequirementInput = {
  id?: string;
  key: string;
  label: string;
  isHard: boolean;
  /** Raw JSON from the database; validated inside the engine. */
  rule: unknown;
};

export type RequirementResult = {
  key: string;
  label: string;
  isHard: boolean;
  status: RequirementStatus;
  /** Short factual explanation in pt-BR. Never advice. */
  reason: string;
  /** True when the stored rule failed validation (treated as manual check). */
  invalidRule?: boolean;
};

export type PathwayInput = {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  requirements: RequirementInput[];
};

export type PathwaySummary = {
  total: number;
  meets: number;
  doesNotMeet: number;
  insufficientInfo: number;
  manualCheck: number;
  /** Keys of eliminatory requirements the profile does not meet. */
  hardFailures: string[];
  /** Keys that can only be checked by the person against the official source. */
  manualKeys: string[];
  /** Keys that need more profile information. */
  missingInfoKeys: string[];
  /** Keys whose stored rule is invalid (content to fix in the admin). */
  invalidRuleKeys: string[];
};

export type PathwayResult = {
  pathwayId: string;
  slug: string;
  name: string;
  countryCode: string;
  results: RequirementResult[];
  summary: PathwaySummary;
};
