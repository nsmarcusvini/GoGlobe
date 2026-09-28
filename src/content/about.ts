// /sobre copy (pt-BR), direção "Rastreio".
// COPY: rascunho escrito pelo Claude, PENDENTE DE REVISÃO do fundador. Tom neutro.
// The traced example (texts, URL, dates) comes from the database, never from here.

export const aboutCopy = {
  eyebrow: "Sobre o GoGlobe",
  title: "Uma informação, do governo até a sua tela.",
  lead: "O GoGlobe não tem opinião sobre o seu caso. Tem um método: ler a fonte oficial, resumir em português, carimbar a data e conferir de novo. Role a página e acompanhe um requisito real fazendo esse caminho.",
  traceLabel: "Rastreio de um requisito",
  steps: [
    {
      n: "01",
      title: "Publicado pelo governo",
      body: "Tudo começa numa página oficial de imigração. É ela que vale: se o GoGlobe e o governo divergirem, vale o governo.",
    },
    {
      n: "02",
      title: "Lido por nós",
      body: "Lemos a página e resumimos o requisito em português claro, sem acrescentar nada que não esteja na fonte.",
    },
    {
      n: "03",
      title: "Verificado e datado",
      body: "Cada requisito recebe a data da última verificação e o link exato de onde saiu. Sem fonte e data, ele fica como rascunho e não aparece.",
    },
    {
      n: "04",
      title: "Na sua tela",
      body: "No app, o requisito aparece com a fonte e a data ao lado. Com o seu perfil, mostramos se ele atende pelo que você informou, nunca se você deve aplicar.",
    },
    {
      n: "05",
      title: "Conferido de novo",
      body: "Uma checagem automática testa os links das fontes e aponta tudo o que passou de 90 dias sem verificação, para voltar à primeira parada.",
    },
  ],
  stage: {
    officialPage: "Página oficial",
    readOn: (date: string) => `lida em ${date}`,
    ourSummary: "Resumo GoGlobe",
    stamp: "Verificado",
    appCard: "Como aparece no app",
    appNote: "Com o seu perfil, este cartão mostra se o requisito atende pelo que você informou.",
    recheck: "Próxima conferência",
    recheckBy: (date: string) => `até ${date}`,
    recheckBody:
      "Link testado automaticamente; conteúdo com mais de 90 dias volta para a verificação.",
    noExample:
      "O exemplo real aparece aqui quando a base de conteúdo está conectada. O método é o mesmo para todos os requisitos.",
  },
  stats: {
    title: "O que está no mapa hoje",
    pathways: "caminhos publicados",
    requirements: "requisitos com fonte e data",
    sources: "páginas oficiais citadas",
    lastVerified: "última verificação",
  },
  never: {
    title: "O que o GoGlobe não faz",
    items: [
      "Não indica qual visto escolher nem qual é melhor para você.",
      "Não avalia as suas chances de aprovação.",
      "Não diz para qual caminho você deve aplicar.",
      "Não presta aconselhamento migratório nem jurídico.",
    ],
    professionals:
      "Para orientação sobre o seu caso: na Austrália, um agente de migração registrado (RMA); na Nova Zelândia, um consultor licenciado (LIA); no Canadá, um consultor regulado (RCIC) ou advogado.",
  },
  sourcesTitle: "De onde vêm as informações",
  cta: "Ver os países cobertos",
} as const;
