import { describe, expect, it } from "vitest";
import { parseRule, RULE_OPS } from "./rules";

describe("parseRule", () => {
  it.each([
    { op: "age_max", value: 44 },
    { op: "age_min", value: 18 },
    { op: "english_min", level: "intermediate" },
    { op: "english_min", tests: [{ test: "IELTS", min_score: 6 }] },
    { op: "education_min", level: "bachelor" },
    { op: "experience_min_years", value: 1 },
    { op: "budget_min_brl", value: 50000 },
    { op: "occupation_in_list", list: "CSOL" },
    { op: "goal_in", goals: ["work", "residence"] },
    { op: "manual", reason: "Oferta de emprego" },
    { op: "manual" },
  ])("accepts %j", (rule) => {
    expect(parseRule(rule).ok).toBe(true);
  });

  it.each([
    [null, "not an object"],
    [{}, "missing op"],
    [{ op: "best_pathway" }, "unknown operator"],
    [{ op: "age_max" }, "missing value"],
    [{ op: "age_max", value: -1 }, "negative age"],
    [{ op: "age_max", value: 44.5 }, "fractional age"],
    [{ op: "english_min" }, "english without level or tests"],
    [{ op: "english_min", level: "native" }, "unknown level"],
    [{ op: "english_min", tests: [] }, "empty test list"],
    [{ op: "goal_in", goals: [] }, "empty goals"],
    [{ op: "age_max", value: 44, extra: true }, "unknown key"],
  ])("rejects %j (%s)", (rule) => {
    const result = parseRule(rule);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });

  it("covers every operator in RULE_OPS", () => {
    expect(RULE_OPS).toHaveLength(9);
  });
});
