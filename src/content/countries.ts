// Country page copy (pt-BR). Only verifiable facts about the official bodies.
// COPY: rascunho, PENDENTE DE REVISÃO do fundador.

export const countryCopy: Record<
  string,
  { authority: string; summary: string; professional: string }
> = {
  AU: {
    authority: "Department of Home Affairs",
    summary:
      "Caminhos de trabalho qualificado, estudo, residência e working holiday publicados pelo governo australiano, organizados em português com a fonte oficial de cada requisito.",
    professional: "Agente de migração registrado (RMA)",
  },
  NZ: {
    authority: "Immigration New Zealand",
    summary:
      "Caminhos de residência, trabalho, estudo e working holiday publicados pela Immigration New Zealand, com a fonte oficial de cada requisito.",
    professional: "Consultor de imigração licenciado (LIA)",
  },
  CA: {
    authority: "Immigration, Refugees and Citizenship Canada (IRCC)",
    summary:
      "Programas do Express Entry, nomeação provincial, estudo e trabalho pós-graduação publicados pelo IRCC, com a fonte oficial de cada requisito.",
    professional: "Consultor regulado (RCIC) ou advogado",
  },
};
