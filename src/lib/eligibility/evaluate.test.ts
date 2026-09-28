import { describe, expect, it } from "vitest";
import {
  ageOn,
  evaluateAll,
  evaluatePathway,
  evaluateRequirement,
  hasCompatibleRequirements,
  sortPathways,
  SORT_CRITERION_LABEL,
} from "./evaluate";
import { EMPTY_PROFILE, profileFromRow } from "./profile";
import type { EligibilityProfile, PathwayInput, RequirementInput } from "./types";

const TODAY = "2026-09-28";
const ctx = { today: TODAY };

const profile = (overrides: Partial<EligibilityProfile> = {}): EligibilityProfile => ({
  ...EMPTY_PROFILE,
  ...overrides,
});

const req = (rule: unknown, overrides: Partial<RequirementInput> = {}): RequirementInput => ({
  key: "k",
  label: "Requisito",
  isHard: true,
  rule,
  ...overrides,
});

const statusOf = (rule: unknown, p: EligibilityProfile, today = TODAY) =>
  evaluateRequirement(req(rule), p, { today }).status;

// -------------------------------------------------------------------- ages --
describe("ageOn", () => {
  it.each([
    ["1981-09-28", "2026-09-28", 45], // birthday today: already 45
    ["1981-09-29", "2026-09-28", 44], // birthday tomorrow: still 44
    ["1981-09-27", "2026-09-28", 45],
    ["2008-02-29", "2026-02-28", 17], // leap-day birth, non-leap year: not yet
    ["2008-02-29", "2026-03-01", 18], // ... birthday counted on 1 March
    ["2008-02-29", "2028-02-29", 20], // leap year: on the day
    ["2026-09-28", "2026-09-28", 0],
  ])("born %s, on %s → %i", (birth, today, expected) => {
    expect(ageOn(birth, today)).toBe(expected);
  });

  it.each([
    ["2026-09-29", "2026-09-28"], // born in the future
    ["2026-02-30", "2026-09-28"], // impossible date
    ["28/09/1990", "2026-09-28"], // wrong format
    ["1990-01-01", "not-a-date"],
  ])("returns null for %s on %s", (birth, today) => {
    expect(ageOn(birth, today)).toBeNull();
  });
});

describe("age rules (inclusive limits)", () => {
  const under45 = { op: "age_max", value: 44 };

  it("meets age_max on the last day before turning 45", () => {
    expect(statusOf(under45, profile({ birthDate: "1981-09-29" }))).toBe("meets");
  });

  it("does not meet age_max on the 45th birthday", () => {
    expect(statusOf(under45, profile({ birthDate: "1981-09-28" }))).toBe("does_not_meet");
  });

  it("working holiday window 18–30 inclusive", () => {
    const min = { op: "age_min", value: 18 };
    const max = { op: "age_max", value: 30 };
    const turns18Today = profile({ birthDate: "2008-09-28" });
    const turns31Today = profile({ birthDate: "1995-09-28" });
    const turns31Tomorrow = profile({ birthDate: "1995-09-29" });
    expect(statusOf(min, turns18Today)).toBe("meets");
    expect(statusOf(min, profile({ birthDate: "2008-09-29" }))).toBe("does_not_meet");
    expect(statusOf(max, turns31Tomorrow)).toBe("meets");
    expect(statusOf(max, turns31Today)).toBe("does_not_meet");
  });

  it("asks for the birth date when missing or invalid", () => {
    expect(statusOf(under45, profile())).toBe("insufficient_info");
    expect(statusOf(under45, profile({ birthDate: "1990-13-01" }))).toBe("insufficient_info");
  });

  it("explains the verdict factually", () => {
    const result = evaluateRequirement(req(under45), profile({ birthDate: "1990-01-15" }), ctx);
    expect(result.reason).toBe("Você tem 36 anos hoje; o critério é máximo de 44 anos.");
  });
});

// ----------------------------------------------------------------- english --
describe("english_min", () => {
  const competent = {
    op: "english_min",
    tests: [
      { test: "IELTS", min_score: 6, scope: "each_component" },
      { test: "CELPIP", min_score: 7, scope: "each_component" },
    ],
  };
  const smc = {
    op: "english_min",
    tests: [
      { test: "IELTS", min_score: 6.5, scope: "overall" },
      { test: "PTE", min_score: 58, scope: "overall" },
    ],
  };

  it("per-skill rules compare the lowest skill score, not the overall", () => {
    // Overall 7.5 but writing 5.5: does not meet "6 in each".
    const p = profile({ englishTest: "IELTS", englishScore: 7.5, englishLowestComponent: 5.5 });
    expect(statusOf(competent, p)).toBe("does_not_meet");
  });

  it("per-skill boundary is inclusive", () => {
    const p = profile({ englishTest: "IELTS", englishScore: 6, englishLowestComponent: 6 });
    expect(statusOf(competent, p)).toBe("meets");
  });

  it("overall rules compare the overall score", () => {
    expect(statusOf(smc, profile({ englishTest: "IELTS", englishScore: 6.5 }))).toBe("meets");
    expect(statusOf(smc, profile({ englishTest: "IELTS", englishScore: 6 }))).toBe("does_not_meet");
    expect(statusOf(smc, profile({ englishTest: "PTE", englishScore: 58 }))).toBe("meets");
  });

  it("asks for the right score when the test is known but the score is missing", () => {
    const result = evaluateRequirement(
      req(competent),
      profile({ englishTest: "IELTS", englishScore: 7 }),
      ctx,
    );
    expect(result.status).toBe("insufficient_info");
    expect(result.reason).toContain("menor nota entre as 4 habilidades");
  });

  it("uses the right scale per test (CELPIP 7, not IELTS 6)", () => {
    const p = profile({ englishTest: "CELPIP", englishLowestComponent: 6 });
    expect(statusOf(competent, p)).toBe("does_not_meet");
  });

  it("a test the rule cannot compare becomes a manual check", () => {
    const p = profile({ englishTest: "Duolingo", englishScore: 130 });
    expect(statusOf(competent, p)).toBe("manual_check");
  });

  it("without any test, a test-based rule needs information (level is not enough)", () => {
    const p = profile({ englishLevel: "fluent" });
    expect(statusOf(competent, p)).toBe("insufficient_info");
  });

  it("level-based rules accept the self-declared level", () => {
    const rule = { op: "english_min", level: "intermediate" };
    expect(statusOf(rule, profile({ englishLevel: "advanced" }))).toBe("meets");
    expect(statusOf(rule, profile({ englishLevel: "intermediate" }))).toBe("meets");
    expect(statusOf(rule, profile({ englishLevel: "basic" }))).toBe("does_not_meet");
    expect(statusOf(rule, profile())).toBe("insufficient_info");
  });

  it("with both, a comparable test wins over the level", () => {
    const rule = { ...smc, level: "basic" };
    const p = profile({ englishLevel: "fluent", englishTest: "IELTS", englishScore: 5 });
    expect(statusOf(rule, p)).toBe("does_not_meet");
  });

  it("falls back to the level when the test is not listed", () => {
    const rule = { ...smc, level: "intermediate" };
    const p = profile({ englishLevel: "advanced", englishTest: "Duolingo", englishScore: 120 });
    expect(statusOf(rule, p)).toBe("meets");
  });
});

// ------------------------------------------------------------ other rules --
describe("other operators", () => {
  it("education_min follows the level order", () => {
    const rule = { op: "education_min", level: "bachelor" };
    expect(statusOf(rule, profile({ educationLevel: "master" }))).toBe("meets");
    expect(statusOf(rule, profile({ educationLevel: "bachelor" }))).toBe("meets");
    expect(statusOf(rule, profile({ educationLevel: "technical" }))).toBe("does_not_meet");
    expect(statusOf(rule, profile())).toBe("insufficient_info");
  });

  it("experience_min_years is inclusive and treats 0 as information", () => {
    const rule = { op: "experience_min_years", value: 1 };
    expect(statusOf(rule, profile({ yearsExperience: 1 }))).toBe("meets");
    expect(statusOf(rule, profile({ yearsExperience: 0.5 }))).toBe("does_not_meet");
    expect(statusOf(rule, profile({ yearsExperience: 0 }))).toBe("does_not_meet");
    expect(statusOf(rule, profile())).toBe("insufficient_info");
  });

  it("budget_min_brl compares the declared budget", () => {
    const rule = { op: "budget_min_brl", value: 50000 };
    expect(statusOf(rule, profile({ budgetBrl: 50000 }))).toBe("meets");
    expect(statusOf(rule, profile({ budgetBrl: 0 }))).toBe("does_not_meet");
    expect(statusOf(rule, profile())).toBe("insufficient_info");
  });

  it("occupation_in_list needs a known mapping", () => {
    const rule = { op: "occupation_in_list", list: "CSOL" };
    expect(statusOf(rule, profile({ occupationLists: ["CSOL", "MLTSSL"] }))).toBe("meets");
    expect(statusOf(rule, profile({ occupationLists: [] }))).toBe("does_not_meet");
    expect(statusOf(rule, profile())).toBe("insufficient_info");
  });

  it("goal_in", () => {
    const rule = { op: "goal_in", goals: ["study"] };
    expect(statusOf(rule, profile({ goal: "study" }))).toBe("meets");
    expect(statusOf(rule, profile({ goal: "work" }))).toBe("does_not_meet");
    expect(statusOf(rule, profile())).toBe("insufficient_info");
  });

  it("manual is always a manual check, whatever the profile", () => {
    const full = profile({
      birthDate: "1990-01-01",
      educationLevel: "doctorate",
      yearsExperience: 20,
      englishLevel: "fluent",
      budgetBrl: 1e7,
      goal: "work",
      occupationLists: ["X"],
    });
    expect(statusOf({ op: "manual" }, full)).toBe("manual_check");
    expect(statusOf({ op: "manual" }, profile())).toBe("manual_check");
  });
});

// ------------------------------------------------------------ invalid rule --
describe("invalid rules never break the engine", () => {
  it.each([
    [null],
    ["texto"],
    [{}],
    [{ op: "melhor_visto" }],
    [{ op: "age_max", value: "44" }],
    [{ op: "english_min", tests: [{ test: "IELTS", min_score: 6 }] }], // no scope
  ])("%j → manual check flagged as invalid", (rule) => {
    const result = evaluateRequirement(req(rule), profile({ birthDate: "1990-01-01" }), ctx);
    expect(result.status).toBe("manual_check");
    expect(result.invalidRule).toBe(true);
  });
});

// ---------------------------------------------------------------- pathways --
const pathway = (
  id: string,
  countryCode: string,
  requirements: RequirementInput[],
  name = id,
): PathwayInput => ({ id, slug: id, name, countryCode, requirements });

describe("evaluatePathway summary", () => {
  const skilled = pathway("skilled", "AU", [
    req({ op: "age_max", value: 44 }, { key: "age" }),
    req(
      { op: "english_min", tests: [{ test: "IELTS", min_score: 6, scope: "each_component" }] },
      { key: "english" },
    ),
    req({ op: "manual", reason: "Convite" }, { key: "invitation" }),
    req({ op: "experience_min_years", value: 3 }, { key: "experience", isHard: false }),
    req({ op: "melhor_visto" }, { key: "broken" }),
  ]);

  it("counts every status and lists the relevant keys", () => {
    const result = evaluatePathway(
      skilled,
      profile({ birthDate: "1975-01-01", yearsExperience: 1 }),
      ctx,
    );
    expect(result.summary).toEqual({
      total: 5,
      meets: 0,
      doesNotMeet: 2,
      insufficientInfo: 1,
      manualCheck: 2,
      hardFailures: ["age"], // experience is not eliminatory
      manualKeys: ["invitation", "broken"],
      missingInfoKeys: ["english"],
      invalidRuleKeys: ["broken"],
    });
    expect(hasCompatibleRequirements(result)).toBe(false);
  });

  it("an empty profile never produces a hard failure", () => {
    const result = evaluatePathway(skilled, EMPTY_PROFILE, ctx);
    expect(result.summary.hardFailures).toEqual([]);
    expect(result.summary.meets).toBe(0);
    expect(hasCompatibleRequirements(result)).toBe(true);
  });

  it("a pathway with no requirements has an empty summary", () => {
    const result = evaluatePathway(pathway("empty", "NZ", []), EMPTY_PROFILE, ctx);
    expect(result.summary.total).toBe(0);
    expect(hasCompatibleRequirements(result)).toBe(true);
  });

  it("is deterministic for the same inputs", () => {
    const p = profile({ birthDate: "1990-05-05", englishTest: "IELTS", englishLowestComponent: 6 });
    expect(evaluatePathway(skilled, p, ctx)).toEqual(evaluatePathway(skilled, p, ctx));
  });
});

describe("sortPathways (organisation, not recommendation)", () => {
  const failing = (n: number) =>
    Array.from({ length: n }, (_, i) => req({ op: "age_max", value: 20 }, { key: `a${i}` }));
  const p = profile({ birthDate: "1980-01-01" });

  it("orders by country (AU, NZ, CA), then fewer hard failures, then name", () => {
    const results = evaluateAll(
      [
        pathway("ca-1", "CA", []),
        pathway("au-2", "AU", failing(2), "Beta"),
        pathway("nz-1", "NZ", failing(1)),
        pathway("au-0", "AU", [], "Zeta"),
        pathway("au-1", "AU", failing(1), "Alfa"),
        pathway("au-0b", "AU", [], "Alfa"),
      ],
      p,
      ctx,
    );
    expect(results.map((r) => r.pathwayId)).toEqual([
      "au-0b",
      "au-0",
      "au-1",
      "au-2",
      "nz-1",
      "ca-1",
    ]);
  });

  it("unknown countries go last, alphabetically", () => {
    const sorted = sortPathways([
      evaluatePathway(pathway("x", "ZZ", []), p, ctx),
      evaluatePathway(pathway("y", "BR", []), p, ctx),
      evaluatePathway(pathway("z", "NZ", []), p, ctx),
    ]);
    expect(sorted.map((r) => r.countryCode)).toEqual(["NZ", "BR", "ZZ"]);
  });

  it("does not mutate the input", () => {
    const input = [
      evaluatePathway(pathway("b", "CA", []), p, ctx),
      evaluatePathway(pathway("a", "AU", []), p, ctx),
    ];
    const copy = [...input];
    sortPathways(input);
    expect(input).toEqual(copy);
  });

  it("the UI label says it is not a recommendation", () => {
    expect(SORT_CRITERION_LABEL).toContain("não uma recomendação");
  });
});

// ------------------------------------------------------------- language ---
describe("wording", () => {
  it("reasons never use recommendation language", () => {
    const rules = [
      { op: "age_max", value: 44 },
      { op: "english_min", level: "basic" },
      { op: "education_min", level: "bachelor" },
      { op: "experience_min_years", value: 1 },
      { op: "budget_min_brl", value: 1000 },
      { op: "occupation_in_list", list: "CSOL" },
      { op: "goal_in", goals: ["work"] },
      { op: "manual" },
    ];
    const profiles = [
      EMPTY_PROFILE,
      profile({
        birthDate: "1990-01-01",
        englishLevel: "basic",
        educationLevel: "none",
        yearsExperience: 0,
        budgetBrl: 0,
        goal: "study",
        occupationLists: [],
      }),
    ];
    for (const rule of rules) {
      for (const p of profiles) {
        const reason = evaluateRequirement(req(rule), p, ctx).reason.toLowerCase();
        for (const banned of ["recomend", "melhor opção", "você deve", "garantido", "chance"]) {
          expect(reason).not.toContain(banned);
        }
      }
    }
  });
});

describe("profileFromRow", () => {
  it("maps snake_case columns and coerces numeric strings", () => {
    const result = profileFromRow(
      {
        birth_date: "1990-01-01",
        education_level: "bachelor",
        years_experience: 5,
        english_level: "advanced",
        english_test: "IELTS",
        english_score: "7.5" as unknown as number, // numeric columns can arrive as strings
        english_lowest_component: 6.5,
        budget_brl: 80000,
        goal: "residence",
      },
      ["MLTSSL"],
    );
    expect(result).toEqual({
      birthDate: "1990-01-01",
      educationLevel: "bachelor",
      yearsExperience: 5,
      englishLevel: "advanced",
      englishTest: "IELTS",
      englishScore: 7.5,
      englishLowestComponent: 6.5,
      budgetBrl: 80000,
      goal: "residence",
      occupationLists: ["MLTSSL"],
    });
  });
});
