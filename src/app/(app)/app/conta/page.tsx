import type { Metadata } from "next";
import { deleteAccount } from "@/app/(app)/app/actions";
import { ActionForm } from "@/components/admin/action-form";
import { TextField } from "@/components/admin/controls";
import { ButtonLink } from "@/components/ui/button";
import { appCopy } from "@/content/app";
import { QUESTIONS } from "@/content/onboarding";
import { openBillingPortal } from "@/app/(marketing)/precos/actions";
import { Button } from "@/components/ui/button";
import { paymentsEnabled } from "@/lib/billing/config";
import { getEntitlements } from "@/lib/billing/plan";
import { requireUser } from "@/lib/data/user";

export const metadata: Metadata = { title: "Conta" };

const t = appCopy.account;

function answerLabel(questionId: string, value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && !value.length)
  ) {
    return "—";
  }
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (question && "choices" in question) {
    const values = Array.isArray(value) ? value : [String(value)];
    return values
      .map((v) => question.choices.find((c) => c.value === String(v))?.label ?? v)
      .join(", ");
  }
  if (questionId === "birth_date" && typeof value === "string") {
    return value.split("-").reverse().join("/");
  }
  if (questionId === "budget_brl") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(Number(value));
  }
  return String(value);
}

export default async function AccountPage() {
  const { supabase, user, profile } = await requireUser("/app/conta");
  const [{ isPro }, { data: subscription }] = await Promise.all([
    getEntitlements(supabase),
    supabase
      .from("subscriptions")
      .select("billing_kind, status, current_period_end, stripe_customer_id")
      .maybeSingle(),
  ]);
  const periodEnd = subscription?.current_period_end
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
        new Date(subscription.current_period_end),
      )
    : null;
  const rows: Array<[string, string]> = [
    ["Data de nascimento", answerLabel("birth_date", profile.birth_date)],
    ["Estado civil", answerLabel("marital_status", profile.marital_status)],
    [
      "Filhos que viajariam",
      answerLabel(
        "has_children",
        profile.has_children === null ? null : String(profile.has_children),
      ),
    ],
    ["Objetivo", answerLabel("goal", profile.goal)],
    ["Países", answerLabel("target_countries", profile.target_countries)],
    ["Escolaridade", answerLabel("education_level", profile.education_level)],
    ["Profissão", answerLabel("occupation_text", profile.occupation_text)],
    ["Anos de experiência", answerLabel("years_experience", profile.years_experience)],
    ["Inglês (autoavaliação)", answerLabel("english_level", profile.english_level)],
    [
      "Teste de inglês",
      profile.english_test
        ? `${profile.english_test} · geral ${profile.english_score ?? "—"} · menor habilidade ${profile.english_lowest_component ?? "—"}`
        : "—",
    ],
    ["Orçamento", answerLabel("budget_brl", profile.budget_brl)],
  ];

  return (
    <div className="grid gap-14">
      <header className="grid gap-5">
        <p className="type-eyebrow">{t.eyebrow}</p>
        <h1 className="type-display">{t.title}</h1>
        <p className="type-mono text-ink-muted">
          {t.email}: {user.email}
        </p>
      </header>

      <section aria-labelledby="profile-title" className="grid gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="profile-title" className="type-title">
            {t.profile}
          </h2>
          <ButtonLink href="/app/onboarding" variant="secondary">
            {t.editProfile}
          </ButtonLink>
        </div>
        <dl className="grid gap-px overflow-hidden rounded-md bg-line sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 bg-surface p-4">
              <dt className="type-mono text-ink-muted">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="plan-title"
        className="grid justify-items-start gap-4 border-t border-line pt-10"
      >
        <h2 id="plan-title" className="type-title">
          Plano
        </h2>
        <p className="type-mono">
          <span className={isPro ? "font-semibold text-green-ink" : "text-ink-muted"}>
            {isPro ? "Pro" : "Gratuito"}
          </span>
          {isPro && subscription?.billing_kind === "pass" && periodEnd
            ? ` · passe válido até ${periodEnd}`
            : ""}
          {isPro && subscription?.billing_kind === "subscription" && periodEnd
            ? ` · renova em ${periodEnd}`
            : ""}
        </p>
        {isPro && paymentsEnabled() && subscription?.stripe_customer_id ? (
          <form action={openBillingPortal}>
            <Button type="submit" variant="secondary">
              Gerenciar assinatura
            </Button>
          </form>
        ) : !isPro ? (
          <ButtonLink href="/precos" variant="secondary" arrow>
            Ver plano Pro
          </ButtonLink>
        ) : null}
      </section>

      <section
        aria-labelledby="export-title"
        className="grid justify-items-start gap-4 border-t border-line pt-10"
      >
        <h2 id="export-title" className="type-title">
          {t.exportTitle}
        </h2>
        <p className="max-w-[60ch] text-ink-muted">{t.exportBody}</p>
        <a
          href="/app/conta/exportar"
          download
          className="inline-flex h-11 items-center rounded-sm px-5 font-semibold shadow-[inset_0_0_0_1px_var(--line-strong)] transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--ink)]"
        >
          {t.exportCta}
        </a>
      </section>

      <section
        aria-labelledby="delete-title"
        className="grid max-w-xl gap-4 rounded-md border-l-2 border-(--status-fails) bg-(--status-fails-bg) p-6"
      >
        <h2 id="delete-title" className="type-title">
          {t.deleteTitle}
        </h2>
        <p>{t.deleteBody}</p>
        <ActionForm action={deleteAccount} submitLabel={t.deleteCta} submitVariant="secondary">
          <TextField name="confirm" label={t.deleteConfirmLabel} autoComplete="off" required />
        </ActionForm>
      </section>
    </div>
  );
}
