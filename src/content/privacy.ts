// Privacy policy (pt-BR, LGPD).
// COPY: RASCUNHO escrito pelo Claude. PENDENTE DE REVISÃO JURÍDICA antes do lançamento.
// Items in [colchetes] are pending facts the founder must provide.

export const PRIVACY_PENDING = {
  controller: "[razão social e CNPJ do controlador: pendente]",
  contact: "[e-mail do encarregado de dados (DPO): pendente]",
} as const;

export const privacyCopy = {
  eyebrow: "Privacidade",
  title: "Política de privacidade",
  updated: "Versão preliminar de 29/09/2026, pendente de revisão jurídica.",
  sections: [
    {
      id: "quem",
      title: "Quem trata seus dados",
      body: [
        `O GoGlobe é operado por ${PRIVACY_PENDING.controller}, controlador dos dados pessoais tratados nesta plataforma, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).`,
      ],
    },
    {
      id: "dados",
      title: "Quais dados coletamos",
      body: [
        "Conta: seu e-mail, usado para login por link de acesso.",
        "Perfil (informado por você): data de nascimento, estado civil, se tem filhos que viajariam, objetivo, países de interesse, escolaridade, profissão, anos de experiência, nível e resultados de teste de inglês e orçamento aproximado.",
        "Acompanhamento: caminhos que você acompanha, itens do checklist, notas, prazos e custos que você adicionar ao simulador.",
        "Assinatura: status do plano e identificadores do cliente no Stripe. Dados de cartão ou Pix são tratados diretamente pelo Stripe e nunca passam pelos nossos servidores.",
        "Uso (somente com seu consentimento): páginas e etapas visitadas, para medir o funil do produto.",
      ],
    },
    {
      id: "finalidade",
      title: "Para que usamos",
      body: [
        "Comparar o seu perfil com os critérios publicados pelos governos e mostrar os resultados, requisito por requisito.",
        "Manter seus caminhos acompanhados, checklist e simulações.",
        "Processar a assinatura do plano Pro.",
        "Com consentimento, medir o uso do site para melhorar o produto.",
        "Não usamos seus dados para aconselhamento migratório, não vendemos dados e não os usamos para publicidade.",
      ],
    },
    {
      id: "base",
      title: "Bases legais",
      body: [
        "Execução de contrato e procedimentos preliminares (art. 7º, V): conta, perfil, resultados, checklist e assinatura.",
        "Consentimento (art. 7º, I): medição de uso e cookies não essenciais, que você pode recusar ou revogar a qualquer momento.",
        "Cumprimento de obrigação legal (art. 7º, II): registros exigidos por lei, quando aplicável.",
      ],
    },
    {
      id: "compartilhamento",
      title: "Com quem compartilhamos",
      body: [
        "Com operadores que prestam serviços essenciais: Supabase (banco de dados e autenticação), Vercel (hospedagem e, com consentimento, medição de uso) e Stripe (pagamentos). Esses serviços podem armazenar dados fora do Brasil, com as salvaguardas previstas na LGPD.",
        "Não compartilhamos seus dados com consultorias, agentes de migração ou anunciantes.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      body: [
        "Essenciais: cookies de sessão do login e o registro da sua escolha sobre cookies (gg_consent).",
        "Não essenciais, só com seu aceite: identificador anônimo de medição (gg_aid) e a medição do Vercel Analytics. Você pode mudar a escolha em “Preferências de cookies”, no rodapé.",
      ],
    },
    {
      id: "retencao",
      title: "Por quanto tempo guardamos",
      body: [
        "Enquanto sua conta existir. Ao excluir a conta, apagamos perfil, caminhos acompanhados, checklist, notas e eventos de uso ligados a você. Registros que a lei exija manter (por exemplo, fiscais de pagamentos) são guardados pelo prazo legal.",
      ],
    },
    {
      id: "direitos",
      title: "Seus direitos",
      body: [
        "Você pode, a qualquer momento: acessar e exportar seus dados em JSON (Conta → Exportar dados), corrigir o perfil, excluir a conta (Conta → Excluir conta) e revogar o consentimento de medição.",
        `Para outros pedidos previstos no art. 18 da LGPD, escreva para ${PRIVACY_PENDING.contact}.`,
      ],
    },
  ],
} as const;
