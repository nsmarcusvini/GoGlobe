import "server-only";
import { todayInBrasilia } from "@/lib/app/today";
import {
  getExchangeRates,
  listPathways,
  toEngineInput,
  type Requirement,
} from "@/lib/data/content";
import type { Profile, requireUser } from "@/lib/data/user";
import { evaluatePathway, profileFromRow, type RequirementStatus } from "@/lib/eligibility";

type Client = Awaited<ReturnType<typeof requireUser>>["supabase"];

// Profile answers the Base asks to complete (the English test is optional:
// "not taken yet" is a valid answer, so it never counts as missing).
const PROFILE_FIELDS = [
  "birth_date",
  "marital_status",
  "has_children",
  "goal",
  "target_countries",
  "education_level",
  "occupation_text",
  "years_experience",
  "english_level",
  "budget_brl",
] as const;

export function profileProgress(profile: Profile) {
  const missing = PROFILE_FIELDS.filter((field) => {
    const value = profile[field];
    return value === null || value === "" || (Array.isArray(value) && value.length === 0);
  });
  return {
    total: PROFILE_FIELDS.length,
    answered: PROFILE_FIELDS.length - missing.length,
    missing,
  };
}

export type Stop = {
  id: string;
  title: string;
  isDone: boolean;
  doneAt: string | null;
  dueDate: string | null;
};

export type BaseRoute = {
  planId: string;
  pathway: { slug: string; name: string; countryCode: string };
  done: Stop[];
  next: Stop | null;
  upcoming: Stop[];
  total: number;
  doneCount: number;
};

export type SourcedRequirement = {
  pathway: string;
  pathwaySlug: string;
  countryCode: string;
  label: string;
  description: string | null;
  rule: Requirement["rule"];
  status: RequirementStatus;
  reason: string;
  sourceUrl: string;
  verifiedAt: string;
};

export type Destination = {
  code: string;
  name: string;
  officialSite: string;
  currency: string;
  brlRate: number | null;
  plans: {
    id: string;
    slug: string;
    name: string;
    total: number;
    done: number;
    next: string | null;
  }[];
};

/** Everything the Base shows, from the user's own data plus verified content. */
export async function loadBase(supabase: Client, profile: Profile) {
  const [{ data: plans, error }, pathways, rates] = await Promise.all([
    supabase
      .from("user_plans")
      .select(
        "id, created_at, pathway:pathways!inner(id, slug, name_pt, country:countries!inner(code)), items:checklist_items(id, title, is_done, done_at, due_date, sort_order)",
      )
      .order("created_at"),
    listPathways(supabase),
    getExchangeRates(supabase),
  ]);
  if (error) throw new Error(error.message);

  const followed = (plans ?? []).map((plan) => {
    const pathway = plan.pathway as unknown as {
      id: string;
      slug: string;
      name_pt: string;
      country: { code: string };
    };
    const items = [...(plan.items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    return { id: plan.id, pathway, items };
  });

  // The route follows the oldest plan that still has something to do.
  const current = followed.find((p) => p.items.some((i) => !i.is_done)) ?? followed[0] ?? null;
  const toStop = (i: (typeof followed)[number]["items"][number]): Stop => ({
    id: i.id,
    title: i.title,
    isDone: i.is_done,
    doneAt: i.done_at,
    dueDate: i.due_date,
  });
  let route: BaseRoute | null = null;
  if (current) {
    const nextIndex = current.items.findIndex((i) => !i.is_done);
    const done = current.items.filter((i) => i.is_done);
    route = {
      planId: current.id,
      pathway: {
        slug: current.pathway.slug,
        name: current.pathway.name_pt,
        countryCode: current.pathway.country.code,
      },
      done: done.slice(-2).map(toStop),
      next: nextIndex >= 0 ? toStop(current.items[nextIndex]!) : null,
      upcoming:
        nextIndex >= 0
          ? current.items
              .slice(nextIndex + 1)
              .filter((i) => !i.is_done)
              .slice(0, 3)
              .map(toStop)
          : [],
      total: current.items.length,
      doneCount: done.length,
    };
  }

  // Requirements (English tests, occupation, skills assessment) of followed pathways.
  const engineProfile = profileFromRow(profile);
  const today = todayInBrasilia();
  const followedIds = new Set(followed.map((p) => p.pathway.id));
  const english: SourcedRequirement[] = [];
  const work: SourcedRequirement[] = [];
  for (const pathway of pathways.filter((p) => followedIds.has(p.id))) {
    const evaluation = evaluatePathway(toEngineInput(pathway), engineProfile, { today });
    const results = new Map(evaluation.results.map((r) => [r.key, r]));
    for (const req of pathway.requirements) {
      const target = ["english", "language"].includes(req.key)
        ? english
        : ["occupation", "skills_assessment"].includes(req.key)
          ? work
          : null;
      if (!target) continue;
      const result = results.get(req.key);
      target.push({
        pathway: pathway.name_pt,
        pathwaySlug: pathway.slug,
        countryCode: pathway.country.code,
        label: req.label_pt,
        description: req.description_pt,
        rule: req.rule,
        status: result?.status ?? "manual_check",
        reason: result?.reason ?? "",
        sourceUrl: req.source_url,
        verifiedAt: req.last_verified_at,
      });
    }
  }

  // Destinations: countries chosen in the profile plus any with followed plans.
  const countries = new Map(pathways.map((p) => [p.country.code, p.country]));
  const codes = [
    ...new Set([...profile.target_countries, ...followed.map((p) => p.pathway.country.code)]),
  ];
  const destinations: Destination[] = codes
    .map((code) => countries.get(code))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((c) => ({
      code: c.code,
      name: c.name_pt,
      officialSite: c.official_site_url,
      currency: c.currency,
      brlRate: rates.get(c.currency) ? Number(rates.get(c.currency)!.brl_rate) : null,
      plans: followed
        .filter((p) => p.pathway.country.code === c.code)
        .map((p) => ({
          id: p.id,
          slug: p.pathway.slug,
          name: p.pathway.name_pt,
          total: p.items.length,
          done: p.items.filter((i) => i.is_done).length,
          next: p.items.find((i) => !i.is_done)?.title ?? null,
        })),
    }));

  return { route, destinations, english, work, planCount: followed.length };
}
