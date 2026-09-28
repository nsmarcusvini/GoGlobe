import "server-only";
import { cookies } from "next/headers";
import { hasSupabaseConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { ANON_COOKIE, CONSENT_COOKIE, parseConsent } from "./consent";

// First-party product analytics. Events are written server-side with the
// service role, and ONLY when the visitor accepted analytics (LGPD).

export const EVENT_NAMES = [
  "landing_view",
  "pathway_page_view",
  "signup_started",
  "signup_completed",
  "onboarding_step_completed",
  "onboarding_completed",
  "results_viewed",
  "pathway_followed",
  "checklist_item_done",
  "pro_interest",
  "checkout_started",
  "subscription_active",
  "ai_message",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/** Events a browser may send through /api/events (the rest are server-only). */
export const CLIENT_EVENTS: readonly EventName[] = [
  "landing_view",
  "pathway_page_view",
  "signup_started",
];

type Props = Record<string, string | number | boolean | null>;

/** Records an event if the visitor consented. Never throws: analytics can't break the app. */
export async function track(
  name: EventName,
  options: { userId?: string | null; props?: Props; path?: string; force?: boolean } = {},
): Promise<void> {
  if (!hasSupabaseConfig() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const store = await cookies();
    // `force` is only for server-to-server events without a browser (webhooks),
    // which carry no personal data beyond the user id of a paying customer.
    if (!options.force && parseConsent(store.get(CONSENT_COOKIE)?.value) !== "accepted") return;
    const anonymousId = store.get(ANON_COOKIE)?.value?.slice(0, 64) ?? null;
    await createAdminClient()
      .from("events")
      .insert({
        name,
        user_id: options.userId ?? null,
        anonymous_id: options.userId ? null : anonymousId,
        props: options.props ?? {},
        path: options.path?.slice(0, 300) ?? null,
      });
  } catch {
    // Swallow: tracking is best-effort.
  }
}

/** Webhook variant: no cookies available. */
export async function trackServer(
  name: EventName,
  userId: string,
  props: Props = {},
): Promise<void> {
  if (!hasSupabaseConfig() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    await createAdminClient().from("events").insert({ name, user_id: userId, props });
  } catch {
    // best-effort
  }
}
