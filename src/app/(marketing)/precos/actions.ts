"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/actions";
import { fieldErrors } from "@/lib/admin/schemas";
import { track } from "@/lib/analytics/track";
import { paymentsEnabled, type CheckoutKind } from "@/lib/billing/config";
import { getSession } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getStripe, priceIdFor } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "@/lib/zod";

const WaitlistInput = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  source: z.string().trim().max(60).optional(),
});

/** Fake door: records interest in Pro while payments are off. */
export async function joinWaitlist(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = WaitlistInput.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  if (!(await rateLimit(`waitlist:${await clientIp()}`, 5, 600))) {
    return { ok: false, message: "Muitas tentativas. Tente de novo em alguns minutos." };
  }

  const { error } = await createAdminClient()
    .from("waitlist")
    .upsert(
      { email: parsed.data.email, source: parsed.data.source ?? "precos" },
      { onConflict: "email", ignoreDuplicates: true },
    );
  if (error) return { ok: false, message: "Não foi possível registrar agora. Tente de novo." };

  const { user } = await getSession();
  await track("pro_interest", {
    userId: user?.id,
    props: { source: parsed.data.source ?? "precos" },
  });
  return { ok: true, message: "Pronto. Avisaremos neste e-mail quando o Pro abrir." };
}

const KindInput = z.enum(["monthly", "pass"]);

/** Starts Stripe Checkout for the monthly subscription or the 6-month pass. */
export async function startCheckout(formData: FormData): Promise<void> {
  const kind = KindInput.safeParse(formData.get("kind"));
  if (!kind.success || !paymentsEnabled()) redirect("/precos");

  const { user } = await getSession();
  if (!user) redirect(`/entrar?next=${encodeURIComponent("/precos")}`);

  if (!(await rateLimit(`checkout:${user.id}`, 10, 600))) redirect("/precos?erro=limite");

  const stripe = getStripe();
  const price = priceIdFor(kind.data as CheckoutKind);
  if (!stripe || !price) redirect("/precos?erro=configuracao");

  const site = publicEnv().NEXT_PUBLIC_SITE_URL;
  const isSubscription = kind.data === "monthly";
  const metadata = { user_id: user.id, price_id: price };
  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email,
    metadata,
    locale: "pt-BR",
    // Pix only for the one-off pass, and only once enabled on the Stripe account.
    payment_method_types:
      !isSubscription && process.env.STRIPE_PIX_ENABLED === "true" ? ["card", "pix"] : ["card"],
    ...(isSubscription ? { subscription_data: { metadata } } : {}),
    success_url: `${site}/app/conta?assinatura=ok`,
    cancel_url: `${site}/precos?checkout=cancelado`,
  });

  await track("checkout_started", { userId: user.id, props: { kind: kind.data } });
  if (!session.url) redirect("/precos?erro=checkout");
  redirect(session.url);
}

/** Stripe Customer Portal: manage card, cancel, invoices. */
export async function openBillingPortal(): Promise<void> {
  const { supabase, user } = await getSession();
  if (!user) redirect("/entrar?next=/app/conta");
  const stripe = getStripe();
  const { data } = await supabase.from("subscriptions").select("stripe_customer_id").maybeSingle();
  if (!stripe || !data?.stripe_customer_id) redirect("/app/conta?erro=portal");
  const portal = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${publicEnv().NEXT_PUBLIC_SITE_URL}/app/conta`,
  });
  redirect(portal.url);
}
