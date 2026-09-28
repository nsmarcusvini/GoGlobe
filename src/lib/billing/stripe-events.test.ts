import { describe, expect, it } from "vitest";
import { subscriptionUpdateFromEvent, type StripeEventLike } from "./stripe-events";

const now = new Date("2026-09-29T12:00:00Z");
const opts = { passMonths: 6, now };
const USER = "11111111-1111-4111-8111-111111111111";

const session = (overrides: Record<string, unknown>): StripeEventLike =>
  ({
    id: "evt_1",
    type: "checkout.session.completed",
    data: {
      object: {
        mode: "payment",
        payment_status: "paid",
        client_reference_id: USER,
        customer: "cus_1",
        subscription: null,
        metadata: { price_id: "price_pass" },
        ...overrides,
      },
    },
  }) as StripeEventLike;

const subscription = (type: string, overrides: Record<string, unknown> = {}): StripeEventLike =>
  ({
    id: "evt_2",
    type,
    data: {
      object: {
        id: "sub_1",
        status: "active",
        customer: { id: "cus_1" },
        metadata: { user_id: USER },
        items: { data: [{ current_period_end: 1_800_000_000, price: { id: "price_monthly" } }] },
        ...overrides,
      },
    },
  }) as StripeEventLike;

describe("subscriptionUpdateFromEvent", () => {
  it("paid 6-month pass grants Pro until now + 6 months", () => {
    const update = subscriptionUpdateFromEvent(session({}), opts);
    expect(update).toEqual({
      by: "user",
      userId: USER,
      patch: {
        plan: "pro",
        status: "active",
        billing_kind: "pass",
        stripe_customer_id: "cus_1",
        stripe_subscription_id: null,
        stripe_price_id: "price_pass",
        current_period_end: "2027-03-29T12:00:00.000Z",
      },
    });
  });

  it("unpaid pass (e.g. Pix pending) grants nothing yet", () => {
    expect(subscriptionUpdateFromEvent(session({ payment_status: "unpaid" }), opts)).toBeNull();
  });

  it("async payment success (Pix) grants the pass", () => {
    const event = {
      ...session({}),
      type: "checkout.session.async_payment_succeeded",
    } as StripeEventLike;
    expect(subscriptionUpdateFromEvent(event, opts)?.by).toBe("user");
  });

  it("subscription checkout links customer and subscription to the user", () => {
    const update = subscriptionUpdateFromEvent(
      session({ mode: "subscription", subscription: "sub_1" }),
      opts,
    );
    expect(update).toMatchObject({
      by: "user",
      userId: USER,
      patch: {
        billing_kind: "subscription",
        stripe_subscription_id: "sub_1",
        stripe_customer_id: "cus_1",
      },
    });
  });

  it("falls back to metadata.user_id and ignores sessions without a user", () => {
    expect(
      subscriptionUpdateFromEvent(
        session({ client_reference_id: null, metadata: { user_id: USER } }),
        opts,
      )?.by,
    ).toBe("user");
    expect(
      subscriptionUpdateFromEvent(session({ client_reference_id: null, metadata: {} }), opts),
    ).toBeNull();
  });

  it("subscription updates read the period end from the items", () => {
    const update = subscriptionUpdateFromEvent(subscription("customer.subscription.updated"), opts);
    expect(update).toMatchObject({
      patch: {
        plan: "pro",
        status: "active",
        current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
        stripe_price_id: "price_monthly",
      },
    });
  });

  it.each(["past_due", "unpaid", "incomplete", "canceled"])("status %s is not Pro", (status) => {
    const update = subscriptionUpdateFromEvent(
      subscription("customer.subscription.updated", { status }),
      opts,
    );
    expect(update?.patch.plan).toBe("free");
  });

  it("deleted subscription goes back to free", () => {
    const update = subscriptionUpdateFromEvent(subscription("customer.subscription.deleted"), opts);
    expect(update?.patch).toMatchObject({ plan: "free", status: "canceled" });
  });

  it("without user metadata, updates are keyed by subscription id", () => {
    const update = subscriptionUpdateFromEvent(
      subscription("customer.subscription.updated", { metadata: {} }),
      opts,
    );
    expect(update).toMatchObject({ by: "subscription", subscriptionId: "sub_1" });
  });

  it("ignores unrelated events", () => {
    expect(
      subscriptionUpdateFromEvent({ id: "e", type: "invoice.created", data: { object: {} } }, opts),
    ).toBeNull();
  });
});
