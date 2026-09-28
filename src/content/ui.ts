// Shared UI strings (pt-BR).
import type { RequirementStatus } from "@/lib/eligibility";

export const ui = {
  theme: {
    label: "Tema",
    switchTo: "Mudar para",
    system: "Automático",
    light: "Claro",
    dark: "Escuro",
  },
  nav: {
    home: "Início",
    countries: "Países",
    pricing: "Preços",
    about: "Sobre",
    signIn: "Entrar",
    cta: "Criar perfil grátis",
    skipToContent: "Pular para o conteúdo",
  },
  // Status labels describe the comparison with what the user entered, never advice.
  requirementStatus: {
    meets: { label: "Atende", hint: "pelo que você informou" },
    does_not_meet: { label: "Não atende", hint: "pelo que você informou" },
    insufficient_info: { label: "Falta informação", hint: "complete seu perfil" },
    manual_check: { label: "Verificar", hint: "não dá para avaliar automaticamente" },
  } satisfies Record<RequirementStatus, { label: string; hint: string }>,
  source: {
    label: "Fonte oficial",
    verifiedAt: "verificado em",
    opensInNewTab: "(abre em nova aba)",
  },
  progress: {
    label: "Progresso",
    of: "de",
  },
} as const;
