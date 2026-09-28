// Pricing, waitlist, simulator, comparator and consent copy (pt-BR).
// COPY: rascunho, PENDENTE DE REVISÃO do fundador. Tom neutro e sóbrio.

export const pricingCopy = {
  eyebrow: "Planos",
  title: "Comece de graça. Aprofunde quando fizer sentido.",
  perMonth: "/mês",
  or: "ou",
  pass: (price: string, months: number) => `${price} por ${months} meses, pagamento único`,
  free: "Gratuito",
  pro: "Pro",
  routeTitle: "O que cada plano inclui",
  included: "Incluído",
  notIncluded: "Não incluído",
  startFree: "Começar grátis",
  subscribeMonthly: "Assinar mensal",
  buyPass: "Comprar passe de 6 meses",
  limitReached:
    "Você já acompanha 1 caminho, o limite do plano gratuito. Com o Pro, acompanhe quantos quiser.",
  cancelled: "Pagamento não concluído. Nada foi cobrado.",
  note: "Os valores podem mudar. O plano gratuito continua disponível sem prazo.",
  honesty:
    "O plano Pro organiza mais informação e ferramentas de acompanhamento. Ele não inclui aconselhamento migratório nem aumenta chances de aprovação.",
} as const;

// Return from Stripe Checkout and pricing errors.
export const checkoutCopy = {
  active: "Pagamento confirmado. O plano Pro já está ativo na sua conta.",
  pending:
    "Recebemos o seu pedido. O Pro é ativado assim que o pagamento for confirmado (no Pix, pode levar alguns minutos).",
  invalid:
    "Não conseguimos confirmar este pagamento agora. Se você foi cobrado, o plano é ativado automaticamente em alguns minutos.",
  portal: "Não foi possível abrir o gerenciamento da assinatura agora. Tente de novo em instantes.",
  errors: {
    checkout:
      "Não foi possível abrir o pagamento agora. Nada foi cobrado. Tente de novo em instantes.",
    configuracao: "Os pagamentos estão temporariamente indisponíveis. Nada foi cobrado.",
    limite: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.",
  },
} as const;

export const waitlistCopy = {
  eyebrow: "Plano Pro",
  title: "Os pagamentos ainda não estão abertos.",
  body: "Estamos preparando o Pro. Deixe seu e-mail para ser avisado quando abrir. Não enviamos outro tipo de mensagem.",
  emailLabel: "E-mail",
  submit: "Quero ser avisado",
  close: "Fechar",
} as const;

export const consentCopy = {
  label: "Cookies",
  title: "Medição de uso",
  body: "Usamos cookies essenciais para login. Com sua permissão, também medimos o uso do site para melhorar o produto. Nada é vendido nem compartilhado para publicidade.",
  accept: "Aceitar medição",
  reject: "Recusar",
  policy: "Política de privacidade",
  settings: "Preferências de cookies",
} as const;

export const simulatorCopy = {
  eyebrow: "Custos em R$",
  officialTitle: "Taxas oficiais",
  extrasTitle: "Seus custos",
  total: "Total estimado",
  estimate: (date: string | null) =>
    date
      ? `Estimativa. Taxas oficiais convertidas pela PTAX de ${date}; valores reais variam com câmbio e família.`
      : "Estimativa. Valores reais variam com câmbio e família.",
  noConversion: "sem conversão",
  add: "Adicionar custo",
  labelPlaceholder: "Ex.: passagem, seguro, tradução",
  amount: "Valor (R$)",
  remove: "Remover",
  save: "Salvar simulação",
  proOnly: "Adicione seus próprios custos (passagem, tradução, seguro) com o plano Pro.",
  seePro: "Ver plano Pro",
} as const;

export const compareCopy = {
  eyebrow: "Comparador",
  title: "Caminhos lado a lado",
  lead: "Escolha até 3 caminhos. As linhas mostram, requisito por requisito, como o que você informou se compara em cada um.",
  pick: "Escolha os caminhos",
  apply: "Comparar",
  max: "Até 3 caminhos",
  proOnly: "O comparador é um recurso do plano Pro.",
  seePro: "Ver plano Pro",
  rows: {
    country: "País",
    requirements: "Requisitos",
    hard: "Eliminatórios não atendidos",
    fee: "Taxa oficial (candidato principal)",
    duration: "Duração",
    residence: "Pode levar à residência",
  },
  empty: "Escolha pelo menos 2 caminhos para comparar.",
} as const;

export const alertsCopy = {
  title: "Mudanças neste caminho",
  since: "desde que você começou a acompanhar",
  none: "Nenhuma mudança publicada desde então.",
  proOnly: "Alertas de mudança são um recurso do plano Pro.",
  tables: {
    pathways: "Dados do caminho",
    requirements: "Requisitos",
    pathway_steps: "Etapas",
    documents: "Documentos",
    cost_items: "Custos",
  } as Record<string, string>,
  actions: { insert: "adicionado", update: "alterado", delete: "removido" } as Record<
    string,
    string
  >,
  due: "Prazo",
  dueProOnly: "Prazos são do plano Pro",
} as const;
