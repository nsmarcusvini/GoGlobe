import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/content/onboarding";
import { ANSWER_SCHEMAS, answerInput, isQuestionId } from "./answers";
import { todayInBrasilia } from "./today";

const parse = (id: keyof typeof ANSWER_SCHEMAS, input: Record<string, unknown>) =>
  ANSWER_SCHEMAS[id].safeParse(input);

describe("onboarding answers", () => {
  it("has a schema for every question and vice versa", () => {
    expect(QUESTIONS.map((q) => q.id).sort()).toEqual(Object.keys(ANSWER_SCHEMAS).sort());
    expect(isQuestionId("birth_date")).toBe(true);
    expect(isQuestionId("role")).toBe(false); // never writable from the client
  });

  it("birth date: ISO, not in the future", () => {
    expect(parse("birth_date", { birth_date: "1990-05-10" }).success).toBe(true);
    expect(parse("birth_date", { birth_date: "2999-01-01" }).success).toBe(false);
    expect(parse("birth_date", { birth_date: "10/05/1990" }).success).toBe(false);
    expect(parse("birth_date", { birth_date: "" }).success).toBe(false);
  });

  it("has_children becomes a boolean", () => {
    const result = parse("has_children", { has_children: "false" });
    expect(result.success && result.data).toEqual({ has_children: false });
  });

  it("target countries: at least one known code", () => {
    expect(parse("target_countries", { target_countries: ["AU", "CA"] }).success).toBe(true);
    expect(parse("target_countries", { target_countries: [] }).success).toBe(false);
    expect(parse("target_countries", { target_countries: ["US"] }).success).toBe(false);
  });

  it("years of experience accepts Brazilian decimals and requires a value", () => {
    const result = parse("years_experience", { years_experience: "2,5" });
    expect(result.success && result.data).toEqual({ years_experience: 2.5 });
    expect(parse("years_experience", { years_experience: "0" }).success).toBe(true);
    expect(parse("years_experience", { years_experience: "" }).success).toBe(false);
    expect(parse("years_experience", { years_experience: "-1" }).success).toBe(false);
  });

  it("english test: scores cleared when there is no test", () => {
    const result = parse("english_test", {
      english_test: "",
      english_score: "7",
      english_lowest_component: "6",
    });
    expect(result.success && result.data).toEqual({
      english_test: null,
      english_score: null,
      english_lowest_component: null,
    });
  });

  it("english test: overall score required, decimals with comma", () => {
    expect(parse("english_test", { english_test: "IELTS", english_score: "" }).success).toBe(false);
    const result = parse("english_test", {
      english_test: "IELTS",
      english_score: "7,5",
      english_lowest_component: "6,5",
    });
    expect(result.success && result.data).toEqual({
      english_test: "IELTS",
      english_score: 7.5,
      english_lowest_component: 6.5,
    });
  });

  it("budget accepts formatted reais", () => {
    const result = parse("budget_brl", { budget_brl: "R$ 80.000" });
    expect(result.success && result.data).toEqual({ budget_brl: 80000 });
    expect(parse("budget_brl", { budget_brl: "" }).success).toBe(false);
  });

  it("answerInput reads multi-selects as arrays and ignores action keys", () => {
    const form = new FormData();
    form.append("target_countries", "AU");
    form.append("target_countries", "NZ");
    expect(answerInput("target_countries", form)).toEqual({ target_countries: ["AU", "NZ"] });
    const single = new FormData();
    single.set("goal", "study");
    single.set("$ACTION_ID_abc", "x");
    expect(answerInput("goal", single)).toEqual({ goal: "study" });
  });
});

describe("todayInBrasilia", () => {
  it("uses the Brasília calendar day", () => {
    // 02:00 UTC on 29 Sep is still 28 Sep in Brasília (UTC-3).
    expect(todayInBrasilia(new Date("2026-09-29T02:00:00Z"))).toBe("2026-09-28");
    expect(todayInBrasilia(new Date("2026-09-29T04:00:00Z"))).toBe("2026-09-29");
  });
});
