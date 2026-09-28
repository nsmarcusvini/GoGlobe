import "server-only";
import { PRICES } from "@/lib/billing/config";
import {
  subscriptionUpdateFromEvent,
  type StripeEventLike,
  type SubscriptionUpdate,
} from "@/lib/billing/stripe-events";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SyncResult = "active" | "pending" | "invalid";

async function apply(update: SubscriptionUpdate | null) {
  if (!update) return;
  const db = createAdminClient();
  const { error } =
    update.by === "user"
      ? await db
          .from("subscriptions")
          .upsert({ user_id: update.userId, ...update.patch }, { onConflict: "user_id" })
      : await db
          .from("subscriptions")
          .update(update.patch)
          .eq("stripe_subscription_id", update.subscriptionId);
  if (error) throw new Error(error.message);
}

/**
 * Confirms a Checkout Session when the buyer lands back on the site, so the
 * plan is active right away even if the webhook is late (or, in development,
 * not forwarded). Uses the same mapping as the webhook, so both are idempotent:
 * the pass period counts from the session's creation, never from this visit.
 */
export async function syncCheckoutSession(sessionId: string, userId: string): Promise<SyncResult> {
  const stripe = getStripe();
  if (!stripe || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return "invalid";

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  } catch {
    return "invalid";
  }
  const owner = session.client_reference_id ?? session.metadata?.user_id ?? null;
  if (owner !== userId) return "invalid";
  if (session.status !== "complete") return "pending";

  const subscription =
    session.subscription && typeof session.subscription === "object" ? session.subscription : null;
  const options = { passMonths: PRICES.passMonths, now: new Date(session.created * 1000) };

  const checkout = subscriptionUpdateFromEvent(
    {
      id: `sync_${session.id}`,
      type: "checkout.session.completed",
      data: {
        object: {
          ...session,
          subscription: subscription?.id ?? (session.subscription as string | null),
        },
      },
    } as unknown as StripeEventLike,
    options,
  );
  // A Pix pass stays pending until the money settles (async_payment_succeeded).
  if (!checkout) return "pending";
  await apply(checkout);

  if (subscription) {
    await apply(
      subscriptionUpdateFromEvent(
        {
          id: `sync_${subscription.id}`,
          type: "customer.subscription.updated",
          data: { object: subscription },
        } as unknown as StripeEventLike,
        options,
      ),
    );
  }
  return "active";
}
