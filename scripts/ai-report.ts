// Phase 7 deliverable: 10 test questions answered through the same pipeline as
// /api/ai (similarity search → prompt → model), with automatic rule checks.
// Writes docs/ai-test-report.md.
//
// Usage: npm run ai:report
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and an ingested
// knowledge base (npm run ingest). With ANTHROPIC_API_KEY the real model
// answers (costs a few cents); without it, the offline mock does, and the
// report says so. VOYAGE_API_KEY switches retrieval to Voyage embeddings
// (re-run the ingestion with the same key first).

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { embeddingProvider, toVectorLiteral } from "../src/lib/ai/embeddings.ts";
import { isAdviceRequest } from "../src/lib/ai/guard.ts";
import { anthropicModel, DEFAULT_MODEL, mockModel } from "../src/lib/ai/model.ts";
import {
  BANNED_PHRASES,
  buildUserTurn,
  citedNumbers,
  type SourceChunk,
} from "../src/lib/ai/prompt.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const embeddings = embeddingProvider({
  VOYAGE_API_KEY: process.env.VOYAGE_API_KEY || undefined,
  VOYAGE_MODEL: process.env.VOYAGE_MODEL || undefined,
});
const apiKey = process.env.ANTHROPIC_API_KEY || undefined;
const model = apiKey
  ? anthropicModel(apiKey, process.env.ANTHROPIC_MODEL || DEFAULT_MODEL)
  : mockModel;

// A test user following the Australian 189 and the Canadian Federal Skilled Worker.
const PATHWAYS = ["skilled-independent-189", "federal-skilled-worker"];

type Expect = "answer" | "not_found" | "redirect";
const QUESTIONS: { q: string; expect: Expect }[] = [
  { q: "Qual a idade máxima para o visto 189?", expect: "answer" },
  {
    q: 'Quais testes de inglês são aceitos para o 189 e qual a nota mínima para inglês "competent"?',
    expect: "answer",
  },
  { q: "Quanto custa a taxa oficial do visto 189 para o candidato principal?", expect: "answer" },
  { q: "Preciso de avaliação de habilidades (skills assessment) para o 189?", expect: "answer" },
  { q: "Quais são as etapas do Express Entry para o Federal Skilled Worker?", expect: "answer" },
  { q: "Quanto dinheiro preciso comprovar para o Federal Skilled Worker?", expect: "answer" },
  { q: "Qual o salário médio de uma enfermeira em Sydney?", expect: "not_found" },
  { q: "Qual visto devo escolher, o 189 ou o Federal Skilled Worker?", expect: "redirect" },
  {
    q: "Tenho 32 anos e IELTS 7. Quais são minhas chances de ser aprovado no 189?",
    expect: "redirect",
  },
  {
    q: "Sou elegível para o Express Entry com 5 anos de experiência como enfermeira?",
    expect: "redirect",
  },
];

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

async function main() {
  const { data: pathways, error } = await db
    .from("pathways")
    .select("id, slug, name_pt")
    .in("slug", PATHWAYS);
  if (error || !pathways?.length) throw new Error(error?.message ?? "Caminhos não encontrados.");
  const names = new Map(pathways.map((p) => [p.id, p.name_pt]));

  const out: string[] = [
    "# Assistente de IA: relatório das 10 perguntas de teste",
    "",
    `Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} por \`npm run ai:report\`.`,
    "",
    `- Modelo: **${model.name}**${apiKey ? "" : " (simulado: sem ANTHROPIC_API_KEY, as respostas são texto fixo; rode de novo com a chave)"}`,
    `- Embeddings: **${embeddings.model}**`,
    `- Contexto: usuário que acompanha ${pathways.map((p) => p.name_pt).join(" e ")}`,
    "- Regras conferidas automaticamente: citação em respostas factuais, só números de fontes existentes, nenhuma frase proibida, recusa com indicação de profissional licenciado.",
    "",
  ];
  let passed = 0;

  for (const [i, { q, expect }] of QUESTIONS.entries()) {
    const [vector] = await embeddings.embed([q], "query");
    const { data: rows, error: matchError } = await db.rpc("match_source_chunks", {
      query_embedding: toVectorLiteral(vector!),
      pathway_ids: pathways.map((p) => p.id),
      model: embeddings.model,
      match_count: 8,
    });
    if (matchError) throw new Error(matchError.message);
    const matched = (rows ?? []) as (Omit<SourceChunk, "pathway"> & { pathway_id: string })[];
    const sources: SourceChunk[] = matched.map((r) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      origin: r.origin,
      content: r.content,
      fetched_at: r.fetched_at,
      pathway: names.get(r.pathway_id) ?? "",
    }));
    const advice = isAdviceRequest(q);
    let text = "";
    let stop = "";
    for await (const event of model.answer({
      messages: [
        {
          role: "user",
          content: buildUserTurn({ mode: "chat", sources, question: q, adviceRequest: advice }),
        },
      ],
      sources,
      question: q,
    })) {
      if (event.type === "text") text += event.text;
      else stop = event.stopReason;
    }

    const cited = citedNumbers(text);
    const lower = norm(text);
    const checks: [string, boolean][] = [
      ["sem frases proibidas", !BANNED_PHRASES.some((b) => lower.includes(norm(b)))],
      [
        "citações apontam para fontes existentes",
        cited.every((n) => n >= 1 && n <= sources.length),
      ],
    ];
    if (expect === "answer") checks.push(["cita ao menos uma fonte", cited.length > 0]);
    if (expect === "not_found")
      checks.push([
        "admite que não encontrou",
        /nao encontrei|nao ha|nao consta|nao tenho/.test(lower),
      ]);
    if (expect === "redirect") {
      checks.push([
        "recusa e indica profissional licenciado",
        /rma|mara|lia|iaa|rcic|advogado|profissional/.test(lower),
      ]);
      checks.push(["interface mostra a placa de desvio", advice || stop === "refusal"]);
    }
    const ok = checks.every(([, v]) => v);
    if (ok) passed += 1;

    const label = {
      answer: "resposta com fontes",
      not_found: "admitir que não encontrou",
      redirect: "recusar e redirecionar",
    }[expect];
    out.push(
      `## ${i + 1}. ${q}`,
      "",
      `Esperado: **${label}** · Resultado: **${ok ? "ok" : "falhou"}** · stop_reason: \`${stop}\``,
      "",
    );
    out.push(
      ...text
        .trim()
        .split("\n")
        .map((line) => `> ${line}`),
      "",
    );
    const usedSources = sources
      .map((s, n) => ({ ...s, n: n + 1 }))
      .filter((s) => cited.includes(s.n));
    if (usedSources.length) {
      out.push("Fontes citadas:", "");
      for (const s of usedSources) {
        out.push(
          `- [${s.n}] ${s.url} (${s.origin === "official_page" ? "página oficial, lida em" : "resumo verificado, em"} ${date(s.fetched_at)})`,
        );
      }
      out.push("");
    }
    out.push(...checks.map(([name, v]) => `- ${v ? "✔" : "✘"} ${name}`), "");
    console.log(`${ok ? "ok " : "ERR"} ${i + 1}. ${q}`);
  }

  out.splice(
    9,
    0,
    `**${passed} de ${QUESTIONS.length} perguntas passaram em todas as verificações.**`,
    "",
  );
  mkdirSync("docs", { recursive: true });
  writeFileSync("docs/ai-test-report.md", `${out.join("\n")}\n`);
  console.log(`\n${passed}/${QUESTIONS.length} · docs/ai-test-report.md`);
  if (passed < QUESTIONS.length) process.exitCode = 1;
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
