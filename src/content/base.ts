// Subscriber home ("Base"), direção "Próxima Parada" (pt-BR).
// COPY: rascunho escrito pelo Claude, PENDENTE DE REVISÃO do fundador. Tom neutro.

export const baseCopy = {
  nav: {
    label: "Navegação da conta Pro",
    base: "Base",
    routes: "Minhas rotas",
    assistant: "Assistente",
    account: "Conta",
  },
  eyebrow: "Base · plano Pro",
  greeting: "Sua próxima parada",
  paid: {
    active: "Pagamento confirmado. Bem-vindo ao Pro: sua Base está pronta.",
    pending:
      "Recebemos o seu pedido. O Pro é ativado assim que o pagamento for confirmado (no Pix, pode levar alguns minutos).",
    invalid:
      "Não conseguimos confirmar este pagamento agora. Se você foi cobrado, o plano é ativado automaticamente em alguns minutos.",
  },
  route: {
    label: "Rota do seu checklist",
    done: "Feito",
    next: "Próxima parada",
    later: "Depois",
    due: (date: string) => `prazo ${date}`,
    markDone: "Marcar como feito",
    marking: "Registrando…",
    openPlan: "Abrir checklist completo",
    progress: (done: number, total: number) => `${done} de ${total} itens`,
    arrived: "Todos os itens deste caminho estão feitos.",
    arrivedBody: "Confira na fonte oficial se algo mudou e acompanhe os alertas do caminho.",
    empty: "Escolha um caminho para traçar a rota.",
    emptyBody:
      "Acompanhe um caminho nos seus resultados: o checklist dele vira a sua rota, parada por parada.",
    emptyCta: "Ver meus resultados",
  },
  profile: {
    label: "Parada aberta",
    title: "Complete seu perfil",
    body: (answered: number, total: number) =>
      `${answered} de ${total} respostas. Com o perfil completo, cada requisito mostra se atende pelo que você informou.`,
    cta: "Continuar perfil",
  },
  destinations: {
    title: "Seus destinos",
    none: "Nenhum país escolhido ainda.",
    rate: (currency: string, value: string) => `1 ${currency} ≈ ${value}`,
    official: "Site oficial de imigração",
    noPlan: "Nenhum caminho acompanhado neste país.",
    explore: "Ver caminhos",
    next: "Próximo item",
  },
  tests: {
    title: "Provas de inglês",
    lead: "O que cada caminho que você acompanha pede, lado a lado com o que você informou.",
    yours: "Você informou",
    noTest: "Nenhum teste informado",
    overall: "nota geral",
    each: "em cada habilidade",
    manual: "Verifique na fonte oficial",
    none: "Os caminhos que você acompanha não trazem exigência de inglês registrada.",
  },
  work: {
    title: "Áreas de trabalho",
    lead: "A sua profissão e onde cada caminho confere a ocupação. As listas mudam: confira sempre na fonte oficial.",
    yours: "Sua profissão",
    years: (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "ano" : "anos"} de experiência`,
    missing: "Profissão não informada",
    list: "Abrir lista oficial",
    none: "Os caminhos que você acompanha não exigem ocupação em lista.",
  },
  tools: {
    title: "O que você pode fazer",
    items: [
      {
        href: "/app/comparar",
        label: "Comparar caminhos",
        body: "Até 3 lado a lado, requisito por requisito.",
      },
      {
        href: "/app/painel",
        label: "Minhas rotas",
        body: "Todos os caminhos acompanhados e o progresso.",
      },
      {
        href: "/app/resultados",
        label: "Explorar caminhos",
        body: "Os caminhos dos seus países, com requisitos.",
      },
      {
        href: "/app/conta",
        label: "Conta e dados",
        body: "Plano, exportação dos dados e exclusão.",
      },
    ],
    planTools:
      "No checklist de cada caminho: prazos, notas, simulador de custos e alertas de mudança.",
  },
  assistant: {
    eyebrow: "Assistente",
    title: "Pergunte às fontes",
    body: "Respostas só com trechos das páginas oficiais dos seus caminhos, cada afirmação com a fonte.",
    cta: "Abrir assistente",
  },
  source: "Fonte oficial",
  verified: (date: string) => `verificado em ${date}`,
} as const;
