// Landing copy (pt-BR).
// COPY: rascunho escrito pelo Claude, PENDENTE DE REVISÃO do fundador.
// Regras (seção 2 do spec): nada de "recomendado", "melhor opção", "você deve";
// nenhuma promessa de resultado; só fatos verificáveis sobre os órgãos oficiais.

export const landing = {
  hero: {
    eyebrow: "Austrália · Nova Zelândia · Canadá",
    // Two lines on purpose: the route crosses between them.
    titleTop: "Antes do sonho,",
    titleBottom: "os requisitos.",
    lead: "Monte seu perfil e veja, ao lado das regras publicadas pelos governos, quais caminhos de visto têm requisitos compatíveis com o que você informou. Cada requisito com o link da fonte oficial e a data da última verificação.",
    primaryCta: "Criar meu perfil grátis",
    secondaryCta: "Ver como funciona",
    facts: ["Grátis para começar", "Sem cartão de crédito", "Tudo em português"],
    origin: { coords: "15°47′S 47°52′W", label: "ponto de partida" },
  },

  story: {
    intro: {
      index: "01",
      coords: "15°47′S 47°52′W",
      eyebrow: "Partida",
      title: "Começa por você, não por uma promessa.",
      body: "Idade, formação, experiência, nível de inglês, estado civil, orçamento e objetivo: trabalho, estudo ou residência. O GoGlobe compara esses dados com os critérios públicos de cada programa. Sem palpite e sem ranking de “melhor visto”.",
    },
    countries: [
      {
        code: "AU",
        index: "02",
        name: "Austrália",
        capital: "Canberra",
        coords: "35°17′S 149°08′E",
        authority: "Department of Home Affairs",
        sourceUrl: "https://immi.homeaffairs.gov.au/",
        body: "Organizamos em português os caminhos publicados pelo governo australiano para trabalho qualificado, estudo e residência, com cada requisito ligado à página oficial de onde ele saiu.",
        professional: "Para orientação sobre o seu caso: agente de migração registrado (RMA).",
      },
      {
        code: "NZ",
        index: "03",
        name: "Nova Zelândia",
        capital: "Wellington",
        coords: "41°17′S 174°47′E",
        authority: "Immigration New Zealand",
        sourceUrl: "https://www.immigration.govt.nz/",
        body: "Os critérios vêm do site da Immigration New Zealand. Mostramos o que está publicado e deixamos claro o que só pode ser confirmado caso a caso.",
        professional: "Para orientação sobre o seu caso: consultor de imigração licenciado (LIA).",
      },
      {
        code: "CA",
        index: "04",
        name: "Canadá",
        capital: "Ottawa",
        coords: "45°25′N 75°42′W",
        authority: "Immigration, Refugees and Citizenship Canada (IRCC)",
        sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship.html",
        body: "Em programas com sistema de pontos, exibimos os critérios e o link para a calculadora oficial. Não recriamos a pontuação do governo.",
        professional: "Para orientação sobre o seu caso: consultor regulado (RCIC) ou advogado.",
      },
    ],
  },

  how: {
    eyebrow: "Como funciona",
    title: "Três paradas. Nenhuma promessa.",
    steps: [
      {
        index: "01",
        title: "Seu perfil",
        body: "Cinco etapas curtas, salvas a cada passo. Leva poucos minutos e você pode voltar quando quiser.",
      },
      {
        index: "02",
        title: "Requisito por requisito",
        body: "Cada exigência de cada caminho recebe um status a partir do que você informou. Nada vira nota ou ranking.",
      },
      {
        index: "03",
        title: "Seu checklist",
        body: "Acompanhe um caminho e as etapas e documentos oficiais viram um checklist seu, com notas em cada item.",
      },
    ],
  },

  proof: {
    eyebrow: "Fonte em cada linha",
    title: "Nada aparece aqui sem o link de onde veio.",
    body: "Regras de imigração mudam. Por isso cada requisito mostra a página oficial de origem e a data em que conferimos. Se não conseguimos verificar, o requisito não é publicado.",
    stamp: "Exemplo ilustrativo",
    exampleNote:
      "Exemplo de interface. Os requisitos reais de cada programa aparecem nas páginas de cada caminho.",
    rows: [
      { label: "Faixa de idade exigida pelo programa", status: "meets" },
      { label: "Nível mínimo de inglês (teste reconhecido)", status: "insufficient_info" },
      { label: "Anos de experiência na ocupação", status: "does_not_meet" },
      { label: "Oferta de emprego de empregador aprovado", status: "manual_check" },
    ],
    exampleSource: "https://immi.homeaffairs.gov.au/",
  },

  honesty: {
    eyebrow: "O que o GoGlobe não é",
    title: "Não somos consultoria.",
    points: [
      "Não dizemos qual visto é melhor para você.",
      "Não avaliamos suas chances de aprovação.",
      "Não prometemos visto, emprego nem prazo.",
    ],
    body: "O GoGlobe organiza informação pública para você pesquisar com clareza. Para decidir sobre o seu caso, procure um profissional licenciado:",
    professionals: [
      { country: "Austrália", title: "RMA", description: "Registered Migration Agent" },
      { country: "Nova Zelândia", title: "LIA", description: "Licensed Immigration Adviser" },
      { country: "Canadá", title: "RCIC", description: "ou advogado de imigração" },
    ],
  },

  plans: {
    eyebrow: "Planos",
    title: "Comece de graça. Aprofunde quando fizer sentido.",
    free: {
      name: "Gratuito",
      items: [
        "Perfil e resultados de compatibilidade",
        "Detalhes de cada caminho, com requisitos e fontes",
        "1 caminho acompanhado com checklist",
        "Resumo de custos em reais",
      ],
    },
    pro: {
      name: "Pro",
      items: [
        "Caminhos acompanhados ilimitados",
        "Comparador lado a lado (até 3)",
        "Simulador de custos completo e editável",
        "Prazos e lembretes no checklist",
        "Alertas quando um caminho acompanhado mudar",
      ],
    },
    cta: "Ver planos e preços",
  },

  final: {
    coords: "15°47′S 47°52′W",
    title: "O primeiro passo é saber onde você está.",
    cta: "Criar meu perfil grátis",
  },
} as const;
