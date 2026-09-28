// Runs three example profiles through the eligibility engine against the
// published pathways in the database, and prints a readable report.
// Usage: npm run eligibility:examples [-- --today=2026-09-28] [-- --detail]

import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { evaluateAll, SORT_CRITERION_LABEL } from "../src/lib/eligibility/evaluate.ts";
import { EMPTY_PROFILE } from "../src/lib/eligibility/profile.ts";
import type { EligibilityProfile, PathwayInput } from "../src/lib/eligibility/types.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value] as const;
  }),
);
const today = args.get("today") ?? new Date().toISOString().slice(0, 10);
const detail = args.get("detail") === "true";

const EXAMPLES: Array<{ name: string; description: string; profile: EligibilityProfile }> = [
  {
    name: "Ana, 29 anos, enfermeira",
    description:
      "Graduação, 5 anos de experiência, IELTS geral 7,0 (menor habilidade 6,5), R$ 80 mil, objetivo residência.",
    profile: {
      ...EMPTY_PROFILE,
      birthDate: "1997-03-14",
      educationLevel: "bachelor",
      yearsExperience: 5,
      englishLevel: "advanced",
      englishTest: "IELTS",
      englishScore: 7,
      englishLowestComponent: 6.5,
      budgetBrl: 80000,
      goal: "residence",
    },
  },
  {
    name: "Bruno, 24 anos, desenvolvedor júnior",
    description:
      "Ensino médio completo, 1 ano de experiência, inglês intermediário sem teste, R$ 40 mil, objetivo estudo.",
    profile: {
      ...EMPTY_PROFILE,
      birthDate: "2002-06-02",
      educationLevel: "high_school",
      yearsExperience: 1,
      englishLevel: "intermediate",
      budgetBrl: 40000,
      goal: "study",
    },
  },
  {
    name: "Carla, 47 anos, engenheira",
    description:
      "Mestrado, 20 anos de experiência, PTE Academic geral 65, R$ 200 mil, objetivo trabalho.",
    profile: {
      ...EMPTY_PROFILE,
      birthDate: "1979-01-20",
      educationLevel: "master",
      yearsExperience: 20,
      englishLevel: "fluent",
      englishTest: "PTE",
      englishScore: 65,
      budgetBrl: 200000,
      goal: "work",
    },
  },
];

const STATUS_PT = {
  meets: "atende",
  does_not_meet: "não atende",
  insufficient_info: "falta informação",
  manual_check: "verificar",
} as const;

async function loadPathways(): Promise<PathwayInput[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e a chave anon (.env.local).");
  // Anonymous client on purpose: exactly what a visitor can see (published only).
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("pathways")
    .select(
      "id, slug, name_pt, countries(code), requirements(key, label_pt, is_hard, rule, sort_order)",
    )
    .eq("status", "published");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name_pt,
    countryCode: (p.countries as unknown as { code: string } | null)?.code ?? "??",
    requirements: [
      ...(p.requirements as Array<{
        key: string;
        label_pt: string;
        is_hard: boolean;
        rule: unknown;
        sort_order: number;
      }>),
    ]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => ({ key: r.key, label: r.label_pt, isHard: r.is_hard, rule: r.rule })),
  }));
}

async function main() {
  const pathways = await loadPathways();
  console.log(`# Motor de elegibilidade: perfis de exemplo\n`);
  console.log(`Data de referência: ${today} · ${pathways.length} caminhos publicados`);
  console.log(`${SORT_CRITERION_LABEL}\n`);

  for (const example of EXAMPLES) {
    const results = evaluateAll(pathways, example.profile, { today });
    const compatible = results.filter((r) => r.summary.hardFailures.length === 0);
    console.log(`## ${example.name}\n${example.description}\n`);
    console.log(
      `Sem eliminatório não atendido: ${compatible.length} de ${results.length} caminhos.\n`,
    );
    console.log("| País | Caminho | Atende | Não atende (elim.) | Falta info | Verificar |");
    console.log("|---|---|---|---|---|---|");
    for (const r of results) {
      const s = r.summary;
      const hard = s.hardFailures.length ? ` (${s.hardFailures.join(", ")})` : "";
      console.log(
        `| ${r.countryCode} | ${r.name} | ${s.meets}/${s.total} | ${s.doesNotMeet}${hard} | ${s.insufficientInfo} | ${s.manualCheck} |`,
      );
      if (detail) {
        for (const item of r.results) {
          if (item.status === "manual_check") continue;
          console.log(
            `|  |  ↳ ${item.label}: **${STATUS_PT[item.status]}**. ${item.reason} | | | | |`,
          );
        }
      }
    }
    console.log("");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
