// Legal notice copy (pt-BR). See section 2 of the MVP spec.
// TODO(legal): review with a lawyer before public launch.

export const legalNotice = {
  short:
    "O GoGlobe organiza informações públicas de sites oficiais de imigração. Não prestamos aconselhamento migratório. Confirme qualquer decisão nas fontes oficiais ou com um profissional licenciado.",
  linkLabel: "Leia o aviso legal completo",
  page: {
    title: "Aviso legal",
    paragraphs: [
      "O GoGlobe é uma ferramenta de informação e autoavaliação. Reunimos e organizamos, em português, informações publicadas nos sites oficiais de imigração da Austrália, da Nova Zelândia e do Canadá.",
      "O GoGlobe não presta aconselhamento migratório. Não indicamos qual visto é melhor para você, não avaliamos suas chances pessoais e não dizemos para qual caminho você deve aplicar. Quando mostramos caminhos com requisitos compatíveis com o que você informou, isso é apenas uma comparação entre os dados que você forneceu e os critérios públicos de cada programa.",
      "As regras de imigração mudam com frequência. Cada requisito exibido traz o link da fonte oficial e a data da última verificação. Sempre confirme as informações diretamente na fonte oficial antes de tomar qualquer decisão ou fazer qualquer pagamento.",
      "Para orientação sobre o seu caso, procure um profissional licenciado: na Austrália, um agente de migração registrado (RMA); na Nova Zelândia, um consultor de imigração licenciado (LIA); no Canadá, um consultor regulado (RCIC) ou um advogado.",
    ],
    sourcesTitle: "Órgãos oficiais",
    sources: [
      { label: "Austrália: Department of Home Affairs", url: "https://immi.homeaffairs.gov.au/" },
      { label: "Nova Zelândia: Immigration New Zealand", url: "https://www.immigration.govt.nz/" },
      {
        label: "Canadá: Immigration, Refugees and Citizenship Canada (IRCC)",
        url: "https://www.canada.ca/en/immigration-refugees-citizenship.html",
      },
    ],
  },
} as const;
