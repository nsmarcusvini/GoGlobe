// Assistant copy (pt-BR). Phase 7, direção "Traçado de Rota".

export const assistantCopy = {
  rail: "Assistente",
  page: {
    eyebrow: "Assistente · fontes oficiais",
    title: "Pergunte às fontes.",
    lead: "Cada resposta é um trecho de rota: toda afirmação crava um marco ligado à página oficial de onde saiu, com a data em que foi lida.",
  },
  tab: "Perguntar às fontes",
  close: "Fechar",
  panelTitle: "Diário de bordo",
  context: {
    label: "Perguntar sobre",
    all: "Todos os meus caminhos",
  },
  composer: {
    label: "Sua pergunta",
    placeholder: "Ex.: quais testes de inglês são aceitos para o visto 189?",
    submit: "Perguntar",
    sending: "Traçando…",
    hint: "Enter envia · Shift+Enter quebra linha",
  },
  stamp: {
    label: "Aviso legal",
    text: "Organizamos informações públicas. Não é aconselhamento migratório. Confirme nas fontes oficiais ou com um profissional licenciado.",
    link: "Aviso completo",
  },
  gauge: (used: number, quota: number) => `${used} de ${quota} este mês`,
  gaugeLabel: "Mensagens do mês",
  gaugeRenew: "renova no dia 1º",
  empty: {
    title: "O diário está em branco.",
    body: "Pergunte sobre requisitos, etapas, documentos ou custos dos caminhos que você acompanha. O assistente só responde com o que está nas fontes oficiais.",
    examples: [
      "Quais testes de inglês são aceitos e com qual nota?",
      "Quais documentos preciso traduzir?",
      "Quanto custa a taxa oficial do visto?",
    ],
  },
  noPlans: {
    title: "Nenhuma rota para consultar.",
    body: "O assistente responde sobre os caminhos que você acompanha. Escolha um caminho nos seus resultados para começar.",
    cta: "Ver meus resultados",
  },
  entry: {
    question: "Registro",
    summary: "Resumo em linguagem simples",
    order: "Ordem sugerida do checklist",
    orderNote: "Sugestão de organização. Não decide elegibilidade nem dispensa nenhum item.",
    streaming: "Traçando a rota…",
    done: "Resposta pronta.",
    sources: "Fontes",
    consulted: (n: number) =>
      `+ ${n} ${n === 1 ? "trecho consultado" : "trechos consultados"} sem citação`,
    official: "Página oficial",
    curated: "Resumo verificado GoGlobe",
    readOn: "lida em",
    verifiedOn: "verificado em",
    open: "Abrir fonte oficial",
    mark: (n: number, domain: string) => `Fonte ${n}: ${domain}`,
    noSources: "Nenhum trecho oficial encontrado para esta pergunta.",
  },
  detour: {
    sign: "Fora da rota",
    title: "Isto pede um profissional licenciado.",
    body: "Escolher um visto ou avaliar suas chances é aconselhamento migratório individual. O GoGlobe não faz isso, nem o assistente.",
    who: "Quem pode orientar o seu caso",
    professionals: [
      {
        country: "Austrália",
        role: "Agente de migração registrado (RMA)",
        registry: "Registro oficial OMARA",
        url: "https://www.mara.gov.au/",
      },
      {
        country: "Nova Zelândia",
        role: "Consultor de imigração licenciado (LIA)",
        registry: "Immigration Advisers Authority",
        url: "https://www.iaa.govt.nz/",
      },
      {
        country: "Canadá",
        role: "Consultor regulado (RCIC) ou advogado",
        registry: "College of Immigration and Citizenship Consultants",
        url: "https://college-ic.ca/",
      },
    ],
  },
  actions: {
    summary: "Resumir em linguagem simples",
    order: "Sugerir ordem do checklist",
    lead: "Atalhos desta tela",
  },
  sealed: {
    eyebrow: "Plano Pro",
    title: "Diário selado.",
    body: "O assistente responde perguntas sobre os seus caminhos citando a fonte oficial de cada afirmação, resume caminhos em linguagem simples e sugere a ordem do checklist. É um recurso do plano Pro, com cota mensal.",
    cta: "Conhecer o Pro",
  },
  errors: {
    generic: "Não consegui responder agora. Tente de novo em instantes.",
    network: "Sem conexão com o servidor. Esta mensagem não foi descontada.",
  },
  quotaOut: "Cota do mês esgotada. Ela renova no dia 1º.",
} as const;
