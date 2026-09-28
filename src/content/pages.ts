// Copy for pages still under construction and the 404 (pt-BR).
// COPY: rascunho escrito pelo Claude, PENDENTE DE REVISÃO do fundador.

export const upcoming = {
  about: {
    title: "Sobre o GoGlobe",
    phase: "Fase 5",
    summary: "Quem faz o GoGlobe, de onde vêm os dados e como conferimos cada fonte oficial.",
  },
  pricing: {
    title: "Planos e preços",
    phase: "Fase 6",
    summary: "A comparação completa entre o plano Gratuito e o Pro, com os valores em reais.",
  },
  terms: {
    title: "Termos de uso",
    phase: "Fase 5",
    summary: "As regras de uso do GoGlobe, escritas em português claro.",
  },
  privacy: {
    title: "Política de privacidade",
    phase: "Fase 6",
    summary: "Como o GoGlobe trata os dados do seu perfil, conforme a LGPD.",
  },
  signIn: {
    title: "Entrar",
    phase: "Fase 5",
    summary: "O acesso à sua conta, para retomar perfil, resultados e checklist de onde parou.",
  },
  onboarding: {
    title: "Criar seu perfil",
    phase: "Fase 5",
    summary:
      "Cinco etapas curtas sobre idade, formação, experiência, inglês e objetivo, salvas a cada passo.",
  },
} as const;

export const underConstruction = {
  status: "Trecho em construção",
  meanwhile: "Já no mapa",
  back: "Voltar para o início",
  // Waypoints that already exist: the solid part of the route.
  live: [
    { href: "/", label: "Início" },
    { href: "/#paises", label: "Países cobertos" },
    { href: "/#como-funciona", label: "Como funciona" },
    { href: "/#planos", label: "Planos" },
    { href: "/aviso-legal", label: "Aviso legal" },
  ],
} as const;

export const notFound = {
  coords: "00°00′N 00°00′E",
  status: "Fora da rota",
  title: "Esta página não está no mapa.",
  body: "O endereço pode ter mudado ou nunca ter existido. Volte por um dos pontos abaixo.",
} as const;
