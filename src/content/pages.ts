// Copy for the 404 and error pages (pt-BR).
// COPY: rascunho escrito pelo Claude, PENDENTE DE REVISÃO do fundador.

export const underConstruction = {
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

export const routeBreak = {
  coords: "Trecho interrompido",
  title: "A rota se rompeu aqui.",
  body: "Algo falhou do nosso lado ao carregar esta página. O que já estava salvo continua salvo.",
  retry: "Tentar de novo",
  safeSite: "Voltar ao início",
  safeApp: "Voltar à sua conta",
  globalTitle: "O GoGlobe não carregou.",
} as const;
