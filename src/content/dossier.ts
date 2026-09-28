// Pathway dossier copy (pt-BR). COPY: rascunho, PENDENTE DE REVISÃO do fundador.

export const dossierCopy = {
  sections: {
    requirements: "Requisitos",
    costs: "Custos",
    steps: "Etapas",
    documents: "Documentos",
    sources: "Fontes oficiais",
  },
  categories: {
    work: "Trabalho",
    study: "Estudo",
    residence: "Residência",
    working_holiday: "Working holiday",
  },
  facts: {
    category: "Categoria",
    duration: "Duração",
    residence: "Pode levar à residência permanente",
    residenceYes: "Sim, segundo a fonte oficial",
    residenceNo: "Não diretamente",
    verified: "Última verificação",
  },
  hard: "Eliminatório",
  officialPage: "Página oficial do programa",
  calculator: "Calculadora oficial de pontos",
  calculatorNote:
    "Este programa usa sistema de pontos. O GoGlobe não recalcula a pontuação oficial: use a calculadora do governo.",
  costsNote: (date: string | null) =>
    date
      ? `Taxas de governo para o candidato principal, na moeda oficial. Conversão aproximada em reais pela cotação PTAX do Banco Central de ${date}.`
      : "Taxas de governo para o candidato principal, na moeda oficial.",
  noConversion: "conversão indisponível",
  estimate: "estimativa",
  officialFee: "taxa oficial",
  translation: "Tradução para o inglês exigida para documentos em português",
  translationShort: "Tradução",
  apostille: "Apostilamento",
  ctaTitle: "Compare com o seu perfil",
  ctaBody:
    "Crie seu perfil gratuito para ver, requisito por requisito, como o que você informar se compara a estes critérios.",
  cta: "Criar meu perfil grátis",
  countryLink: (country: string) => `Todos os caminhos: ${country}`,
} as const;
