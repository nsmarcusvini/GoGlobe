// Plan prices and feature matrix (spec section 8). Prices are config, not code:
// PRO_PRICE_MONTHLY_BRL / PRO_PRICE_PASS_BRL override the defaults for display;
// the amount actually charged is the Stripe Price (STRIPE_PRICE_PRO_*).

const num = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const PRICES = {
  monthly: num(process.env.PRO_PRICE_MONTHLY_BRL, 29),
  pass: num(process.env.PRO_PRICE_PASS_BRL, 129),
  passMonths: 6,
} as const;

export const FREE_FOLLOW_LIMIT = 1;

export type CheckoutKind = "monthly" | "pass";

export function paymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === "true";
}

/** Feature rows shown on /precos, in order. */
export const FEATURES: Array<{
  key: string;
  label: string;
  free: string | boolean;
  pro: string | boolean;
}> = [
  { key: "profile", label: "Perfil e resultados de compatibilidade", free: true, pro: true },
  { key: "detail", label: "Detalhe de caminho com requisitos e fontes", free: true, pro: true },
  { key: "follow", label: "Caminhos acompanhados com checklist", free: "1", pro: "Ilimitado" },
  { key: "compare", label: "Comparador lado a lado (até 3 caminhos)", free: false, pro: true },
  {
    key: "simulator",
    label: "Simulador de custos em R$",
    free: "Resumo",
    pro: "Completo, editável",
  },
  { key: "deadlines", label: "Prazos no checklist", free: false, pro: true },
  { key: "alerts", label: "Alertas quando um caminho acompanhado mudar", free: false, pro: true },
  { key: "ai", label: "Assistente de IA (em breve)", free: false, pro: "Com cota mensal" },
];
