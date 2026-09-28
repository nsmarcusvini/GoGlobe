import type { Metadata } from "next";
import { startCheckout } from "@/app/(marketing)/precos/actions";
import { FeatureRoute } from "@/components/billing/feature-route";
import { WaitlistTrigger } from "@/components/billing/waitlist-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { checkoutCopy, pricingCopy as t } from "@/content/billing";
import { FEATURES, paymentsEnabled, PRICES } from "@/lib/billing/config";

export const metadata: Metadata = {
  title: "Planos e preços",
  description: `Gratuito para começar. Pro por R$ ${PRICES.monthly}/mês ou R$ ${PRICES.pass} por ${PRICES.passMonths} meses.`,
  alternates: { canonical: "/precos" },
};

// Livro de Bordo: the price is the headline, cents in mono; the plans differ
// along one route of 8 stops instead of a feature table.
const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

export default async function PricingPage({ searchParams }: PageProps<"/precos">) {
  const params = await searchParams;
  const payments = paymentsEnabled();

  const proActions = payments ? (
    <div className="flex flex-wrap gap-3">
      <form action={startCheckout}>
        <input type="hidden" name="kind" value="monthly" />
        <Button type="submit" size="lg" arrow>
          {t.subscribeMonthly}
        </Button>
      </form>
      <form action={startCheckout}>
        <input type="hidden" name="kind" value="pass" />
        <Button type="submit" size="lg" variant="secondary">
          {t.buyPass}
        </Button>
      </form>
    </div>
  ) : (
    <WaitlistTrigger source="precos">{t.subscribeMonthly}</WaitlistTrigger>
  );

  return (
    <div className="container-page grid gap-(--space-section) py-16 lg:py-24">
      <section aria-labelledby="pricing-title" className="grid gap-12">
        {params.limite === "1" && (
          <p
            role="status"
            className="rounded-md border-l-2 border-(--status-info) bg-(--status-info-bg) p-5 font-medium"
          >
            {t.limitReached}
          </p>
        )}
        {typeof params.erro === "string" && params.erro in checkoutCopy.errors && (
          <p
            role="alert"
            className="rounded-md border-l-2 border-(--status-info) bg-(--status-info-bg) p-5 font-medium"
          >
            {checkoutCopy.errors[params.erro as keyof typeof checkoutCopy.errors]}
          </p>
        )}
        {params.checkout === "cancelado" && (
          <p role="status" className="rounded-md bg-surface-sunk p-5">
            {t.cancelled}
          </p>
        )}

        <div className="grid gap-6">
          <p className="type-eyebrow">{t.eyebrow}</p>
          <h1 id="pricing-title" className="type-display max-w-[18ch]">
            {t.title}
          </h1>
        </div>

        <div className="grid gap-px overflow-hidden rounded-md bg-line lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          {/* Free */}
          <div className="grid content-between gap-10 bg-surface p-8 sm:p-10">
            <div className="grid gap-4">
              <p className="type-mono text-ink-muted">{t.free}</p>
              <p className="type-mega tabular text-[clamp(4rem,2rem+8vw,8rem)]">R$ 0</p>
            </div>
            <ButtonLink
              href="/app/onboarding"
              variant="secondary"
              size="lg"
              arrow
              className="justify-self-start"
            >
              {t.startFree}
            </ButtonLink>
          </div>

          {/* Pro */}
          <div className="relative grid content-between gap-10 overflow-hidden bg-surface p-8 shadow-[inset_0_0_0_1.5px_var(--route)] sm:p-10">
            <div
              aria-hidden="true"
              className="ledger-rules pointer-events-none absolute inset-0 opacity-60"
            />
            <div className="relative grid gap-4">
              <p className="type-mono font-semibold text-green-ink">{t.pro}</p>
              <p className="flex items-baseline gap-3">
                <span className="type-mega tabular text-[clamp(5rem,2rem+11vw,11rem)]">
                  {brl(PRICES.monthly)}
                </span>
                <span className="type-mono text-ink-muted">{t.perMonth}</span>
              </p>
              <p className="type-lead">
                {t.or}{" "}
                <span className="font-semibold text-ink">
                  {t.pass(brl(PRICES.pass), PRICES.passMonths)}
                </span>
              </p>
            </div>
            <div className="relative grid gap-4">
              {proActions}
              <p className="text-[0.9375rem] text-ink-muted">{t.honesty}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="route-title" className="grid gap-8">
        <h2 id="route-title" className="type-title">
          {t.routeTitle}
        </h2>
        <FeatureRoute features={FEATURES} />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <p className="type-mono text-ink-muted">{t.note}</p>
          {payments ? null : (
            <WaitlistTrigger source="precos-rota" variant="secondary" size="md">
              {t.subscribeMonthly}
            </WaitlistTrigger>
          )}
        </div>
      </section>
    </div>
  );
}
