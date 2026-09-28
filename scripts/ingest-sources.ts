// Builds the assistant's knowledge base (source_chunks) from official sources.
//
// For every published pathway:
//   1. official_page: downloads each distinct source_url, extracts the text,
//      splits it into chunks. Sites that block automated reading (Home Affairs
//      answers 403) are reported and skipped, never scraped around.
//   2. curated: our verified summaries (requirements, steps, documents, costs),
//      each tied to the official source_url it was written from and dated by
//      its verification. They cover blocked sites and Portuguese questions.
// Then embeds everything and replaces the pathway's chunks.
//
// Usage: npm run ingest [-- --pathway=slug] [-- --curated-only] [-- --dry-run]
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local).
// Embeddings: Voyage AI with VOYAGE_API_KEY, otherwise the offline lexical provider.

import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { embeddingProvider, toVectorLiteral } from "../src/lib/ai/embeddings.ts";
import { chunkText, extractText, hashText } from "../src/lib/ai/text.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value] as const;
  }),
);
const ONLY = args.get("pathway");
const CURATED_ONLY = args.get("curated-only") === "true";
const DRY_RUN = args.get("dry-run") === "true";
const MAX_CHUNKS_PER_PAGE = 40;

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

type Chunk = {
  url: string;
  title: string | null;
  origin: "official_page" | "curated";
  chunk_index: number;
  content: string;
  fetched_at: string;
};

const brl = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

async function fetchPage(target: string): Promise<{ title: string | null; text: string } | string> {
  try {
    const response = await fetch(target, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "user-agent": "GoGlobe-ingest/1.0 (+https://github.com/nsmarcusvini/GoGlobe)",
        accept: "text/html",
      },
    });
    if (!response.ok) return `HTTP ${response.status}`;
    if (!(response.headers.get("content-type") ?? "").includes("html")) return "não é HTML";
    return extractText(await response.text());
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

async function main() {
  let query = db
    .from("pathways")
    .select(
      "id, slug, name_pt, official_name, summary_pt, official_url, last_verified_at, " +
        "requirements(label_pt, description_pt, source_url, last_verified_at, sort_order), " +
        "pathway_steps(step_order, title_pt, description_pt, estimated_duration_text, source_url), " +
        "documents(name_pt, description_pt, needs_translation, needs_apostille, source_url), " +
        "cost_items(label_pt, amount_min, amount_max, currency, is_estimate, source_url, last_verified_at)",
    )
    .eq("status", "published");
  if (ONLY) query = query.eq("slug", ONLY);
  const { data: pathways, error } = await query;
  if (error) throw new Error(error.message);
  if (!pathways?.length) throw new Error("Nenhum caminho publicado encontrado.");

  console.log(`Embeddings: ${embeddings.model}${DRY_RUN ? " (simulação)" : ""}\n`);
  const pageCache = new Map<string, { title: string | null; text: string } | string>();
  const blocked: string[] = [];

  for (const p of pathways as unknown as Pathway[]) {
    const verified = p.last_verified_at ?? new Date().toISOString();
    const chunks: Chunk[] = [];

    // Curated, source-linked summaries (always).
    const curated: { url: string; text: string; date: string }[] = [
      {
        url: p.official_url,
        text: `${p.name_pt} (${p.official_name}). ${p.summary_pt}`,
        date: verified,
      },
      ...p.requirements
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((r) => ({
          url: r.source_url,
          text: `Requisito de ${p.name_pt}: ${r.label_pt}.${r.description_pt ? ` ${r.description_pt}` : ""}`,
          date: r.last_verified_at,
        })),
      ...p.pathway_steps
        .sort((a, b) => a.step_order - b.step_order)
        .map((s) => ({
          url: s.source_url,
          text: `Etapa ${s.step_order} de ${p.name_pt}: ${s.title_pt}.${s.description_pt ? ` ${s.description_pt}` : ""}${s.estimated_duration_text ? ` Duração estimada: ${s.estimated_duration_text}.` : ""}`,
          date: verified,
        })),
      ...p.documents.map((d) => ({
        url: d.source_url,
        text: `Documento para ${p.name_pt}: ${d.name_pt}.${d.description_pt ? ` ${d.description_pt}` : ""}${d.needs_translation ? " Precisa de tradução." : ""}${d.needs_apostille ? " Precisa de apostila." : ""}`,
        date: verified,
      })),
      ...p.cost_items.map((c) => ({
        url: c.source_url,
        text: `Custo de ${p.name_pt}: ${c.label_pt}, ${c.currency} ${c.amount_min}${c.amount_max ? ` a ${c.amount_max}` : ""}${c.is_estimate ? " (estimativa)" : " (taxa oficial)"}, verificado em ${brl(c.last_verified_at)}.`,
        date: c.last_verified_at,
      })),
    ];
    const byUrl = new Map<string, number>();
    for (const item of curated) {
      const index = byUrl.get(item.url) ?? 0;
      byUrl.set(item.url, index + 1);
      chunks.push({
        url: item.url,
        title: p.name_pt,
        origin: "curated",
        chunk_index: index,
        content: item.text.slice(0, 8000),
        fetched_at: item.date,
      });
    }

    // Official pages.
    if (!CURATED_ONLY) {
      const urls = new Set([p.official_url, ...curated.map((c) => c.url)]);
      for (const target of urls) {
        if (!pageCache.has(target)) pageCache.set(target, await fetchPage(target));
        const page = pageCache.get(target)!;
        if (typeof page === "string") {
          if (!blocked.includes(target)) blocked.push(target);
          console.log(`  ! ${target}: ${page} (fica só o resumo curado)`);
          continue;
        }
        const fetchedAt = new Date().toISOString();
        chunkText(page.text)
          .slice(0, MAX_CHUNKS_PER_PAGE)
          .forEach((content, index) =>
            chunks.push({
              url: target,
              title: page.title,
              origin: "official_page",
              chunk_index: index,
              content,
              fetched_at: fetchedAt,
            }),
          );
      }
    }

    const vectors = await embeddings.embed(
      chunks.map((c) => c.content),
      "document",
    );
    const rows = chunks.map((c, i) => ({
      ...c,
      pathway_id: p.id,
      content_hash: hashText(c.content),
      embedding: toVectorLiteral(vectors[i]!),
      embedding_model: embeddings.model,
    }));
    const official = rows.filter((r) => r.origin === "official_page").length;
    console.log(`${p.slug}: ${rows.length} trechos (${official} de páginas oficiais)`);
    if (DRY_RUN) continue;

    const removed = await db.from("source_chunks").delete().eq("pathway_id", p.id);
    if (removed.error) throw new Error(removed.error.message);
    for (let i = 0; i < rows.length; i += 200) {
      const inserted = await db.from("source_chunks").insert(rows.slice(i, i + 200));
      if (inserted.error) throw new Error(`${p.slug}: ${inserted.error.message}`);
    }
  }

  if (blocked.length) {
    console.log(`\n${blocked.length} página(s) não puderam ser lidas automaticamente.`);
  }
}

type Pathway = {
  id: string;
  slug: string;
  name_pt: string;
  official_name: string;
  summary_pt: string;
  official_url: string;
  last_verified_at: string | null;
  requirements: {
    label_pt: string;
    description_pt: string | null;
    source_url: string;
    last_verified_at: string;
    sort_order: number;
  }[];
  pathway_steps: {
    step_order: number;
    title_pt: string;
    description_pt: string | null;
    estimated_duration_text: string | null;
    source_url: string;
  }[];
  documents: {
    name_pt: string;
    description_pt: string | null;
    needs_translation: boolean;
    needs_apostille: boolean;
    source_url: string;
  }[];
  cost_items: {
    label_pt: string;
    amount_min: number;
    amount_max: number | null;
    currency: string;
    is_estimate: boolean;
    source_url: string;
    last_verified_at: string;
  }[];
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
