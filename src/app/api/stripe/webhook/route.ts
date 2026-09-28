import { NextResponse, type NextRequest } from "next/server";
import { trackServer } from "@/lib/analytics/track";
import { PRICES } from "@/lib/billing/config";
import { subscriptionUpdateFromEvent, type StripeEventLike } from "@/lib/billing/stripe-events";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook: signature-verified, idempotent, writes `subscriptions` with
// the service role (the only writer of that table).
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });

  let event;
  try {
    // Raw body is required for signature verification.
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  const db = createAdminClient();

  // Idempotency: the first insert wins; retries of the same event are no-ops.
  const { error: seenError } = await db
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (seenError) {
    if (seenError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    return NextResponse.json({ error: "Falha ao registrar evento." }, { status: 500 });
  }

  const update = subscriptionUpdateFromEvent(event as unknown as StripeEventLike, {
    passMonths: PRICES.passMonths,
  });

  if (update) {
    const result =
      update.by === "user"
        ? await db
            .from("subscriptions")
            .upsert({ user_id: update.userId, ...update.patch }, { onConflict: "user_id" })
        : await db
            .from("subscriptions")
            .update(update.patch)
            .eq("stripe_subscription_id", update.subscriptionId);

    if (result.error) {
      // Let Stripe retry: forget this event id so the retry is processed.
      await db.from("stripe_events").delete().eq("id", event.id);
      return NextResponse.json({ error: "Falha ao atualizar assinatura." }, { status: 500 });
    }

    if (update.by === "user" && update.patch.plan === "pro") {
      await trackServer("subscription_active", update.userId, {
        kind: update.patch.billing_kind ?? "",
      });
    }
  }

  return NextResponse.json({ received: true });
}
