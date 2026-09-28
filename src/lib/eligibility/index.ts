// Eligibility engine: pure, DB-free functions (see section 6 of the MVP spec).
export * from "./evaluate.ts";
export * from "./profile.ts";
export * from "./rules.ts";
export type * from "./types.ts";

export const REQUIREMENT_STATUSES = [
  "meets",
  "does_not_meet",
  "insufficient_info",
  "manual_check",
] as const;

export function isRequirementStatus(
  value: unknown,
): value is (typeof REQUIREMENT_STATUSES)[number] {
  return typeof value === "string" && (REQUIREMENT_STATUSES as readonly string[]).includes(value);
}
