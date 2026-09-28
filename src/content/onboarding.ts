// Onboarding questions (pt-BR). One question per screen, grouped in 5 stages.
// COPY: rascunho escrito pelo Claude, PENDENTE DE REVISÃO do fundador. Tom neutro.

export type Choice = { value: string; label: string; hint?: string };

export type Question =
  | { id: string; stage: number; kind: "date"; title: string; hint?: string }
  | { id: string; stage: number; kind: "text"; title: string; hint?: string; placeholder?: string }
  | {
      id: string;
      stage: number;
      kind: "number";
      title: string;
      hint?: string;
      unit?: string;
      min?: number;
      max?: number;
      step?: number;
    }
  | { id: string; stage: number; kind: "choice"; title: string; hint?: string; choices: Choice[] }
  | { id: string; stage: number; kind: "multi"; title: string; hint?: string; choices: Choice[] }
  | {
      id: string;
      stage: number;
      kind: "english_test";
      title: string;
      hint?: string;
      choices: Choice[];
    };

export const STAGES = ["Você", "Objetivo", "Formação e trabalho", "Inglês", "Orçamento"] as const;

export const QUESTIONS: Question[] = [
  {
    id: "birth_date",
    stage: 0,
    kind: "date",
    title: "Qual é a sua data de nascimento?",
    hint: "Usada apenas para comparar com os limites de idade publicados pelos programas.",
  },
  {
    id: "marital_status",
    stage: 0,
    kind: "choice",
    title: "Qual é o seu estado civil?",
    choices: [
      { value: "single", label: "Solteiro(a)" },
      { value: "married", label: "Casado(a)" },
      { value: "stable_union", label: "União estável" },
      { value: "divorced", label: "Divorciado(a)" },
      { value: "widowed", label: "Viúvo(a)" },
    ],
  },
  {
    id: "has_children",
    stage: 0,
    kind: "choice",
    title: "Você tem filhos que viajariam com você?",
    choices: [
      { value: "true", label: "Sim" },
      { value: "false", label: "Não" },
    ],
  },
  {
    id: "goal",
    stage: 1,
    kind: "choice",
    title: "Qual é o seu objetivo principal?",
    choices: [
      { value: "work", label: "Trabalhar", hint: "Visto de trabalho, com ou sem empregador." },
      { value: "study", label: "Estudar", hint: "Curso de idioma, técnico ou superior." },
      { value: "residence", label: "Morar de forma permanente", hint: "Residência permanente." },
    ],
  },
  {
    id: "target_countries",
    stage: 1,
    kind: "multi",
    title: "Quais países você quer pesquisar?",
    hint: "Escolha um ou mais. Você pode mudar depois.",
    choices: [
      { value: "AU", label: "Austrália" },
      { value: "NZ", label: "Nova Zelândia" },
      { value: "CA", label: "Canadá" },
    ],
  },
  {
    id: "education_level",
    stage: 2,
    kind: "choice",
    title: "Qual é a sua escolaridade concluída?",
    choices: [
      { value: "none", label: "Fundamental ou sem escolaridade formal" },
      { value: "high_school", label: "Ensino médio" },
      { value: "technical", label: "Curso técnico" },
      { value: "bachelor", label: "Graduação (bacharelado, licenciatura ou tecnólogo)" },
      { value: "postgraduate", label: "Pós-graduação (especialização ou MBA)" },
      { value: "master", label: "Mestrado" },
      { value: "doctorate", label: "Doutorado" },
    ],
  },
  {
    id: "occupation_text",
    stage: 2,
    kind: "text",
    title: "Qual é a sua profissão atual?",
    hint: "Como você descreveria para um colega. Ex.: enfermeira, desenvolvedor, eletricista.",
    placeholder: "Sua profissão",
  },
  {
    id: "years_experience",
    stage: 2,
    kind: "number",
    title: "Quantos anos de experiência você tem nessa profissão?",
    hint: "Conte o tempo de trabalho remunerado. Use 0 se ainda não trabalhou na área.",
    unit: "anos",
    min: 0,
    max: 60,
    step: 0.5,
  },
  {
    id: "english_level",
    stage: 3,
    kind: "choice",
    title: "Como você avalia o seu inglês hoje?",
    hint: "Autoavaliação. Muitos programas exigem teste oficial; isso vem na próxima pergunta.",
    choices: [
      { value: "none", label: "Não falo inglês" },
      { value: "basic", label: "Básico" },
      { value: "intermediate", label: "Intermediário" },
      { value: "advanced", label: "Avançado" },
      { value: "fluent", label: "Fluente" },
    ],
  },
  {
    id: "english_test",
    stage: 3,
    kind: "english_test",
    title: "Você tem resultado de algum teste oficial de inglês?",
    hint: "Informe a nota geral e a menor nota entre as quatro habilidades (compreensão, leitura, escrita e fala).",
    choices: [
      { value: "", label: "Ainda não fiz teste" },
      { value: "IELTS", label: "IELTS" },
      { value: "PTE", label: "PTE Academic" },
      { value: "TOEFL", label: "TOEFL iBT" },
      { value: "CELPIP", label: "CELPIP" },
      { value: "Duolingo", label: "Duolingo English Test" },
    ],
  },
  {
    id: "budget_brl",
    stage: 4,
    kind: "number",
    title: "Quanto você tem disponível para o processo, em reais?",
    hint: "Um valor aproximado. Usado para comparar com custos e comprovações de recursos.",
    unit: "R$",
    min: 0,
    step: 1000,
  },
];

export const onboardingCopy = {
  eyebrow: "Seu perfil",
  of: "de",
  next: "Continuar",
  back: "Voltar",
  skip: "Pular por enquanto",
  saving: "Salvando…",
  finish: "Ver meus resultados",
  saved: "Resposta salva.",
  overall: "Nota geral",
  lowest: "Menor nota entre as 4 habilidades",
  doneTitle: "Perfil completo.",
  doneBody:
    "Suas respostas foram salvas. Os resultados comparam o que você informou com os critérios publicados pelos governos.",
} as const;
