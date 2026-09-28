// Maps a `profiles` row (snake_case, from the database) to the engine's input.
import type { EligibilityProfile } from "./types.ts";

type ProfileRow = {
  birth_date: string | null;
  education_level: EligibilityProfile["educationLevel"];
  years_experience: number | null;
  english_level: EligibilityProfile["englishLevel"];
  english_test: EligibilityProfile["englishTest"];
  english_score: number | null;
  english_lowest_component: number | null;
  budget_brl: number | null;
  goal: EligibilityProfile["goal"];
};

export const EMPTY_PROFILE: EligibilityProfile = {
  birthDate: null,
  educationLevel: null,
  yearsExperience: null,
  englishLevel: null,
  englishTest: null,
  englishScore: null,
  englishLowestComponent: null,
  budgetBrl: null,
  goal: null,
  occupationLists: null,
};

/**
 * @param occupationLists list names containing the user's occupation, or null
 *   when the occupation is unknown or not mapped.
 */
export function profileFromRow(
  row: ProfileRow,
  occupationLists: string[] | null = null,
): EligibilityProfile {
  const num = (value: number | string | null) => (value === null ? null : Number(value));
  return {
    birthDate: row.birth_date,
    educationLevel: row.education_level,
    yearsExperience: num(row.years_experience),
    englishLevel: row.english_level,
    englishTest: row.english_test,
    englishScore: num(row.english_score),
    englishLowestComponent: num(row.english_lowest_component),
    budgetBrl: num(row.budget_brl),
    goal: row.goal,
    occupationLists,
  };
}
