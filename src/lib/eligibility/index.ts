// Eligibility engine: pure, DB-free functions (see section 6 of the MVP spec).
// Implemented in Phase 4. Only the result vocabulary is fixed here.

export const REQUIREMENT_STATUSES = [
  "meets",
  "does_not_meet",
  "insufficient_info",
  "manual_check",
] as const;

export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

export function isRequirementStatus(value: unknown): value is RequirementStatus {
  return typeof value === "string" && (REQUIREMENT_STATUSES as readonly string[]).includes(value);
}
