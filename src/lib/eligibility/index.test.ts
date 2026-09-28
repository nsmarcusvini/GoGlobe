import { describe, expect, it } from "vitest";
import { isRequirementStatus, REQUIREMENT_STATUSES } from ".";

describe("isRequirementStatus", () => {
  it.each(REQUIREMENT_STATUSES)("accepts %s", (status) => {
    expect(isRequirementStatus(status)).toBe(true);
  });

  it.each(["recommended", "", null, undefined, 1])("rejects %s", (value) => {
    expect(isRequirementStatus(value)).toBe(false);
  });
});
