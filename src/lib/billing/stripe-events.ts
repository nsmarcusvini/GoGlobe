// Pure mapping from Stripe webhook events to `subscriptions` updates.
// No I/O here, so every case is unit-tested (stripe-events.test.ts).

type Unix = number;

export type SubscriptionPatch = {
  plan: "free" | "pro";
  status: string;
  billing_kind: "subscription" | "pass";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_end: string | null;
};

export type SubscriptionUpdate =
  | { by: "user"; userId: string; patch: SubscriptionPatch }
  | { by: "subscription"; subscriptionId: string; patch: Partial<SubscriptionPatch> };

// Minimal shapes of the Stripe objects we read (API 2026-08-26.dahlia).
export type CheckoutSessionLike = {
  mode: "payment" | "setup" | "subscription";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  client_reference_id: string | null;
  customer: string | { id: string } | null;
  subscription: string | { id: string } | null;
  metadata: Record<string, string> | null;
};
export type SubscriptionLike = {
  id: string;
  status: string;
  customer: string | { id: string };
  metadata: Record<string, string> | null;
  items: { data: Array<{ current_period_end: Unix; price: { id: string } }> };
};
export type StripeEventLike =
  | {
      id: string;
      type: "checkout.session.completed" | "checkout.session.async_payment_succeeded";
      data: { object: CheckoutSessionLike };
    }
  | {
      id: string;
      type:
        | "customer.subscription.created"
        | "customer.subscription.updated"
        | "customer.subscription.deleted";
      data: { object: SubscriptionLike };
    }
  | { id: string; type: string; data: { object: unknown } };

const idOf = (value: string | { id: string } | null) =>
  value === null ? null : typeof value === "string" ? value : value.id;
const iso = (unix: Unix) => new Date(unix * 1000).toISOString();
const PRO_STATUSES = new Set(["active", "trialing"]);

function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * Returns the subscription change implied by an event, or null for events we
 * ignore. `now` is injected for deterministic tests.
 */
export function subscriptionUpdateFromEvent(
  event: StripeEventLike,
  options: { passMonths: number; now?: Date },
): SubscriptionUpdate | null {
  const now = options.now ?? new Date();

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as CheckoutSessionLike;
    const userId = session.client_reference_id ?? session.metadata?.user_id ?? null;
    if (!userId) return null;

    if (session.mode === "payment") {
      // One-off 6-month pass: Pro only once the money is in (Pix settles async).
      if (session.payment_status !== "paid") return null;
      return {
        by: "user",
        userId,
        patch: {
          plan: "pro",
          status: "active",
          billing_kind: "pass",
          stripe_customer_id: idOf(session.customer),
          stripe_subscription_id: null,
          stripe_price_id: session.metadata?.price_id ?? null,
          current_period_end: addMonths(now, options.passMonths).toISOString(),
        },
      };
    }

    if (session.mode === "subscription") {
      // Link the customer/subscription to the user; status and period come
      // from customer.subscription.* events.
      return {
        by: "user",
        userId,
        patch: {
          plan: "pro",
          status: "active",
          billing_kind: "subscription",
          stripe_customer_id: idOf(session.customer),
          stripe_subscription_id: idOf(session.subscription),
          stripe_price_id: session.metadata?.price_id ?? null,
          current_period_end: null,
        },
      };
    }
    return null;
  }

  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as SubscriptionLike;
    const deleted = event.type === "customer.subscription.deleted";
    const periodEnd = Math.max(0, ...subscription.items.data.map((i) => i.current_period_end));
    const status = deleted ? "canceled" : subscription.status;
    const patch: Partial<SubscriptionPatch> = {
      plan: !deleted && PRO_STATUSES.has(subscription.status) ? "pro" : "free",
      status,
      billing_kind: "subscription",
      stripe_customer_id: idOf(subscription.customer),
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id ?? null,
      current_period_end: periodEnd ? iso(periodEnd) : null,
    };
    const userId = subscription.metadata?.user_id;
    return userId
      ? { by: "user", userId, patch: patch as SubscriptionPatch }
      : { by: "subscription", subscriptionId: subscription.id, patch };
  }

  return null;
}
