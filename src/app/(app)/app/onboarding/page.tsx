import type { Metadata } from "next";
import { OnboardingFlow, type Answers } from "@/components/app/onboarding-flow";
import { requireUser } from "@/lib/data/user";

export const metadata: Metadata = { title: "Seu perfil" };

export default async function OnboardingPage() {
  const { profile } = await requireUser("/app/onboarding");
  const str = (value: unknown) =>
    value === null || value === undefined ? undefined : String(value);

  const initial: Answers = Object.fromEntries(
    Object.entries({
      birth_date: str(profile.birth_date),
      marital_status: str(profile.marital_status),
      has_children: str(profile.has_children),
      goal: str(profile.goal),
      target_countries: profile.target_countries.length ? profile.target_countries : undefined,
      education_level: str(profile.education_level),
      occupation_text: str(profile.occupation_text),
      years_experience: str(profile.years_experience),
      english_level: str(profile.english_level),
      // A completed profile without a test answered "no test": keep it as "".
      english_test: profile.english_test ?? (profile.onboarding_completed_at ? "" : undefined),
      english_score: str(profile.english_score),
      english_lowest_component: str(profile.english_lowest_component),
      budget_brl: str(profile.budget_brl),
    }).filter(([, value]) => value !== undefined),
  ) as Answers;

  return <OnboardingFlow initial={initial} completed={!!profile.onboarding_completed_at} />;
}
