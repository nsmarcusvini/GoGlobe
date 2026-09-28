// LGPD consent for non-essential analytics. Shared by server and client code.
export const CONSENT_COOKIE = "gg_consent";
export const ANON_COOKIE = "gg_aid";
export type Consent = "accepted" | "rejected";

export function parseConsent(value: string | undefined | null): Consent | null {
  return value === "accepted" || value === "rejected" ? value : null;
}
