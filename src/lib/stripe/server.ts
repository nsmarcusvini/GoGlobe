import "server-only";
import Stripe from "stripe";

let client: Stripe | null | undefined;

/** Stripe client, or null when STRIPE_SECRET_KEY is not configured. */
export function getStripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key, { appInfo: { name: "GoGlobe" } }) : null;
  return client;
}

export function priceIdFor(kind: "monthly" | "pass"): string | null {
  const id =
    kind === "monthly"
      ? process.env.STRIPE_PRICE_PRO_MONTHLY
      : process.env.STRIPE_PRICE_PRO_6MONTHS;
  return id || null;
}
