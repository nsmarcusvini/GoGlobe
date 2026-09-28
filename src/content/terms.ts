// Terms of use (pt-BR).
// COPY: RASCUNHO escrito pelo Claude. PENDENTE DE REVISÃO JURÍDICA antes do lançamento.
// Items in [colchetes] are pending facts the founder must provide.

export const TERMS_PENDING = {
  company: "[razão social e CNPJ: pendente]",
  contact: "[e-mail de contato: pendente]",
  forum: "[cidade do foro: pendente]",
  minAge: "[idade mínima para contratar: pendente de definição]",
} as const;

export function termsCopy(prices: { monthly: number; pass: number; passMonths: number }) {
  const brl = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  return {
    eyebrow: "Termos",
    title: "Termos de uso",
    updated: "Versão preliminar de 29/09/2026, pendente de revisão jurídica.",
    sections: [
      {
        id: "aceite",
        title: "Quem somos e aceite",
        body: [
          `O GoGlobe é operado por ${TERMS_PENDING.company}. Ao criar uma conta ou usar o site, você concorda com estes termos e com a Política de privacidade.`,
          "Se não concordar com algum ponto, não use o serviço.",
        ],
      },
      {
        id: "servico",
        title: "O que é o GoGlobe",
        body: [
          "O GoGlobe é uma ferramenta de informação e autoavaliação. Organizamos, em português, informações publicadas nos sites oficiais de imigração da Austrália, da Nova Zelândia e do Canadá, e comparamos os dados que você informa com os critérios públicos de cada programa.",
          "O GoGlobe não presta aconselhamento migratório nem jurídico. Não indicamos qual visto escolher, não avaliamos suas chances de aprovação e não dizemos para qual caminho você deve aplicar. Para orientação sobre o seu caso, procure um profissional licenciado: RMA na Austrália, LIA na Nova Zelândia, RCIC ou advogado no Canadá.",
        ],
      },
      {
        id: "informacoes",
        title: "Informações e fontes oficiais",
        body: [
          "Cada requisito exibido traz o link da fonte oficial e a data da última verificação. As regras de imigração mudam com frequência e podem mudar entre uma verificação e outra.",
          "Antes de qualquer decisão ou pagamento a um governo, confirme a informação na fonte oficial. Em caso de divergência, vale sempre o que está publicado pelo governo.",
        ],
      },
      {
        id: "conta",
        title: "Sua conta",
        body: [
          "O acesso é feito por link enviado ao seu e-mail. Você é responsável por manter o acesso a esse e-mail e pelas informações que cadastra no seu perfil.",
          `Para contratar o plano Pro: ${TERMS_PENDING.minAge}.`,
          "Você pode exportar seus dados e excluir sua conta a qualquer momento, na página Conta.",
        ],
      },
      {
        id: "assistente",
        title: "Assistente de IA",
        body: [
          "O assistente responde apenas com base em trechos das fontes oficiais dos caminhos que você acompanha e cita a fonte de cada afirmação. Respostas geradas por IA podem conter erros: confira sempre a fonte citada.",
          "O assistente não recomenda vistos nem avalia chances pessoais. O uso tem cota mensal, indicada na própria tela.",
        ],
      },
      {
        id: "planos",
        title: "Planos e pagamentos",
        body: [
          "O plano gratuito não tem prazo. O plano Pro libera recursos adicionais descritos na página Preços.",
          `Assinatura mensal: ${brl(prices.monthly)} por mês, com renovação automática até o cancelamento. Passe de ${prices.passMonths} meses: ${brl(prices.pass)}, pagamento único, sem renovação automática.`,
          "Os pagamentos são processados pelo Stripe. Dados de cartão ou Pix não passam pelos nossos servidores. Os valores podem mudar para novas contratações, com aviso prévio na página Preços.",
        ],
      },
      {
        id: "cancelamento",
        title: "Cancelamento e reembolso",
        body: [
          "Direito de arrependimento: em até 7 dias da contratação, você pode desistir e receber o valor pago de volta, integralmente, conforme o artigo 49 do Código de Defesa do Consumidor.",
          "Assinatura mensal: pode ser cancelada a qualquer momento em Conta, Gerenciar assinatura. O acesso Pro continua até o fim do período já pago, e não há cobrança seguinte. Após os 7 dias de arrependimento, não há reembolso proporcional do período em curso.",
          "Passe: após os 7 dias de arrependimento, não há reembolso do período restante.",
        ],
      },
      {
        id: "uso",
        title: "Uso permitido",
        body: [
          "Use o GoGlobe para fins pessoais. Não é permitido copiar o conteúdo em massa, usar robôs para extrair dados, revender o acesso, tentar burlar limites do plano ou interferir no funcionamento do site.",
          "Podemos suspender contas que violem estes termos, com aviso quando possível.",
        ],
      },
      {
        id: "propriedade",
        title: "Propriedade intelectual",
        body: [
          "Os textos oficiais pertencem aos respectivos governos e são citados com link para a fonte. A organização, os resumos em português, o design e o software do GoGlobe são protegidos por direitos autorais.",
        ],
      },
      {
        id: "responsabilidade",
        title: "Limites de responsabilidade",
        body: [
          "O GoGlobe se esforça para manter as informações corretas e atualizadas, mas não garante aprovação de visto nem o resultado de qualquer processo. As decisões sobre o seu processo migratório são suas e dos órgãos oficiais.",
          "Nada nestes termos limita direitos garantidos a você pelo Código de Defesa do Consumidor.",
        ],
      },
      {
        id: "privacidade",
        title: "Privacidade",
        body: [
          "O tratamento dos seus dados pessoais está descrito na Política de privacidade, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
        ],
      },
      {
        id: "alteracoes",
        title: "Alterações destes termos",
        body: [
          "Podemos atualizar estes termos. Mudanças relevantes serão avisadas no site e por e-mail antes de valer. A data da versão aparece no topo desta página.",
        ],
      },
      {
        id: "lei",
        title: "Lei aplicável, foro e contato",
        body: [
          `Estes termos seguem a lei brasileira. Fica eleito o foro de ${TERMS_PENDING.forum}, sem prejuízo do direito do consumidor de propor ação no foro do seu domicílio.`,
          `Contato: ${TERMS_PENDING.contact}.`,
        ],
      },
    ],
  };
}
