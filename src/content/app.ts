// Logged-in app copy (pt-BR). COPY: rascunho, PENDENTE DE REVISÃO do fundador.
// Tom neutro e institucional. Nunca: "recomendado", "melhor opção", "você deve".

export const appCopy = {
  rail: {
    profile: "Perfil",
    results: "Resultados",
    dashboard: "Painel",
    account: "Conta",
  },
  signOut: "Sair",
  results: {
    eyebrow: "Resultados",
    title: "Caminhos e requisitos",
    lead: "Cada caminho mostra, requisito por requisito, como o que você informou se compara aos critérios publicados. Nenhum caminho é indicado como melhor ou pior.",
    compatible: (n: number, total: number) =>
      `${n} de ${total} caminhos sem requisito eliminatório não atendido pelo que você informou.`,
    compatibleHint:
      "Isso não significa elegibilidade: requisitos marcados como “Verificar” ou “Falta informação” ainda precisam ser confirmados.",
    showAll: "Ver todos os países",
    showTargets: "Ver só meus países",
    incomplete: "Seu perfil está incompleto. Complete para ver mais requisitos avaliados.",
    completeProfile: "Completar perfil",
    hardFailures: (n: number) => `${n} eliminatório(s) não atendido(s)`,
    open: "Ver requisitos",
    empty: "Nenhum caminho publicado para os países escolhidos ainda.",
    mapLabel: (countries: string) => `Mapa com rotas do Brasil até ${countries}.`,
  },
  pathway: {
    follow: "Acompanhar este caminho",
    following: "Você acompanha este caminho",
    openPlan: "Abrir checklist",
    yourStatus: "Pelo que você informou",
    back: "Resultados",
  },
  plan: {
    eyebrow: "Checklist",
    steps: "Etapas",
    documents: "Documentos",
    notes: "Notas",
    saveNotes: "Salvar nota",
    markDone: "Marcar como concluído",
    markUndone: "Marcar como pendente",
    status: "Situação",
    statuses: {
      exploring: "Explorando",
      preparing: "Preparando",
      applied: "Pedido enviado",
      paused: "Pausado",
      done: "Concluído",
    },
    updateStatus: "Atualizar",
    unfollow: "Deixar de acompanhar",
    unfollowConfirm: "Deixar de acompanhar este caminho? O checklist e as notas serão apagados.",
    source: "Ver na fonte oficial",
    translation: "Documento brasileiro: exige tradução",
    changed:
      "Este caminho mudou desde que você começou a acompanhá-lo. Confira os requisitos atualizados.",
  },
  dashboard: {
    eyebrow: "Painel",
    title: "Suas rotas",
    empty: "Você ainda não acompanha nenhum caminho.",
    emptyCta: "Ver resultados",
    progress: (done: number, total: number) => `${done} de ${total}`,
    next: "Próximo item",
    allDone: "Todos os itens concluídos",
    mapLabel: "Mapa com as rotas que você acompanha e o progresso de cada uma.",
  },
  account: {
    eyebrow: "Conta",
    title: "Seus dados",
    email: "E-mail",
    profile: "Perfil",
    editProfile: "Editar perfil",
    exportTitle: "Exportar dados",
    exportBody:
      "Baixe em JSON tudo o que o GoGlobe guarda sobre você: perfil, caminhos acompanhados, checklist e assinatura.",
    exportCta: "Baixar meus dados",
    deleteTitle: "Excluir conta",
    deleteBody:
      "Apaga definitivamente sua conta, perfil, caminhos acompanhados, checklist e notas. Não é possível desfazer.",
    deleteConfirmLabel: "Digite EXCLUIR para confirmar",
    deleteCta: "Excluir minha conta",
  },
} as const;
