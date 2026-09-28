import { describe, expect, it } from "vitest";
import { CostInput, fieldErrors, PathwayInput, RequirementInput } from "./schemas";

const basePathway = {
  country_id: "10000000-0000-4000-8000-000000000001",
  slug: "skilled-independent-189",
  official_name: "Skilled Independent visa",
  name_pt: "Visto 189",
  category: "residence",
  summary_pt: "Resumo",
  typical_duration_text: "",
  leads_to_residence: "on",
  official_url: "https://immi.homeaffairs.gov.au/",
  points_calculator_url: "",
  draft_reason: "",
};

describe("PathwayInput", () => {
  it("normalises empty optionals to null and checkboxes to booleans", () => {
    const parsed = PathwayInput.parse(basePathway);
    expect(parsed.typical_duration_text).toBeNull();
    expect(parsed.points_calculator_url).toBeNull();
    expect(parsed.leads_to_residence).toBe(true);
  });

  it("rejects non-https sources and bad slugs", () => {
    const result = PathwayInput.safeParse({
      ...basePathway,
      slug: "Visto 189",
      official_url: "http://immi.homeaffairs.gov.au/",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.slug).toBeDefined();
      expect(errors.official_url).toBeDefined();
    }
  });
});

describe("RequirementInput", () => {
  const base = {
    key: "age",
    label_pt: "Idade",
    description_pt: "",
    is_hard: "on",
    source_url: "https://immi.homeaffairs.gov.au/",
    sort_order: "1",
  };

  it("parses and validates the rule JSON", () => {
    const parsed = RequirementInput.parse({ ...base, rule: '{"op":"age_max","value":44}' });
    expect(parsed.rule).toEqual({ op: "age_max", value: 44 });
  });

  it("reports invalid JSON and invalid rules on the rule field", () => {
    for (const rule of ["{op:", '{"op":"melhor_visto"}']) {
      const result = RequirementInput.safeParse({ ...base, rule });
      expect(result.success).toBe(false);
      if (!result.success) expect(fieldErrors(result.error).rule).toBeDefined();
    }
  });
});

describe("CostInput", () => {
  it("rejects max below min", () => {
    const result = CostInput.safeParse({
      label_pt: "Taxa",
      amount_min: "100",
      amount_max: "50",
      currency: "aud",
      source_url: "https://immi.homeaffairs.gov.au/",
      sort_order: "0",
    });
    expect(result.success).toBe(false);
  });

  it("uppercases currency and allows an empty max", () => {
    const parsed = CostInput.parse({
      label_pt: "Taxa",
      amount_min: "100",
      amount_max: "",
      currency: "aud",
      source_url: "https://immi.homeaffairs.gov.au/",
      sort_order: "0",
    });
    expect(parsed.currency).toBe("AUD");
    expect(parsed.amount_max).toBeNull();
  });
});
