// Spots questions that ask for individual migration advice (which visa to pick,
// personal chances). The model is told to decline these anyway; flagging them
// reinforces the rule in the prompt and lets the offline mock behave the same.

const ADVICE_PATTERNS = [
  /\b(qual|que|quais)\b.*\b(visto|caminho|programa|pais)\b.*\b(devo|deveria|escolh|melhor|recomend|compensa|indica)/,
  /\b(melhor|mais facil)\b.*\b(visto|caminho|programa|pais|opcao|destino)\b/,
  /\b(devo|deveria)\b.*\b(aplicar|escolher|tentar|ir para|pedir)\b/,
  /\b(minhas?|tenho|qual a|quais as)\b.*\bchances?\b/,
  /\bchances?\b.*\b(aprova|conseguir|passar)/,
  /\b(vou|irei) conseguir\b|\bconsigo (o|um|esse|este) visto\b|\bserei aprovad/,
  /\b(sou|estou) elegivel\b|\bme encaixo\b|\bme qualifico\b/,
  /\bquantos pontos (eu )?(tenho|faco|teria)\b/,
];

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ");
}

export function isAdviceRequest(question: string): boolean {
  const q = normalize(question);
  return ADVICE_PATTERNS.some((pattern) => pattern.test(q));
}

export const PROFESSIONALS =
  "um agente de migração registrado (MARA/RMA) na Austrália, um consultor licenciado (IAA/LIA) na Nova Zelândia, ou um consultor regulamentado (RCIC) ou advogado no Canadá";
