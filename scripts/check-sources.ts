// Content health check.
//   1. Every source_url still answers (HTTP status).
//   2. Lists content whose last_verified_at is older than 90 days.
//   3. Validates every requirement rule against the Zod schema.
//
// Usage: npm run check-sources [-- --stale-days=90] [-- --skip-http]
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from .env.local
// when present). Uses the service role to include drafts; never runs in the browser.
// Exit code 1 when a link is broken (404/410/5xx/network) or a rule is invalid.

import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { parseRule } from "../src/lib/eligibility/rules.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value] as const;
  }),
);
const STALE_DAYS = Number(args.get("stale-days") ?? 90);
const SKIP_HTTP = args.get("skip-http") === "true";
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 5;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

type Source = { url: string; where: string };
type Dated = { where: string; verifiedAt: string | null };

async function load() {
  const [pathways, requirements, steps, documents, costs] = await Promise.all([
    db
      .from("pathways")
      .select("id, slug, status, official_url, points_calculator_url, last_verified_at"),
    db.from("requirements").select("pathway_id, key, rule, source_url, last_verified_at"),
    db.from("pathway_steps").select("pathway_id, step_order, source_url"),
    db.from("documents").select("pathway_id, name_pt, source_url"),
    db.from("cost_items").select("pathway_id, label_pt, source_url, last_verified_at"),
  ]);
  for (const result of [pathways, requirements, steps, documents, costs]) {
    if (result.error) throw new Error(result.error.message);
  }
  return {
    pathways: pathways.data ?? [],
    requirements: requirements.data ?? [],
    steps: steps.data ?? [],
    documents: documents.data ?? [],
    costs: costs.data ?? [],
  };
}

async function checkUrl(target: string): Promise<{ status: number | "erro"; note?: string }> {
  const attempt = async (method: "HEAD" | "GET") => {
    const response = await fetch(target, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "GoGlobe-check-sources/1.0 (+https://github.com/nsmarcusvini/GoGlobe)",
      },
    });
    return response.status;
  };
  try {
    let status = await attempt("HEAD");
    if (status === 405 || status === 403 || status === 404) status = await attempt("GET");
    return { status };
  } catch (error) {
    return { status: "erro", note: error instanceof Error ? error.message : String(error) };
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]!);
      }
    }),
  );
  return results;
}

async function main() {
  const data = await load();
  const slugById = new Map(data.pathways.map((p) => [p.id, p.slug]));
  const slug = (id: string) => slugById.get(id) ?? id;

  // --- sources
  const sources: Source[] = [
    ...data.pathways.flatMap((p) => [
      { url: p.official_url, where: `${p.slug} (página oficial)` },
      ...(p.points_calculator_url
        ? [{ url: p.points_calculator_url, where: `${p.slug} (calculadora)` }]
        : []),
    ]),
    ...data.requirements.map((r) => ({
      url: r.source_url,
      where: `${slug(r.pathway_id)} / requisito ${r.key}`,
    })),
    ...data.steps.map((s) => ({
      url: s.source_url,
      where: `${slug(s.pathway_id)} / etapa ${s.step_order}`,
    })),
    ...data.documents.map((d) => ({
      url: d.source_url,
      where: `${slug(d.pathway_id)} / documento "${d.name_pt}"`,
    })),
    ...data.costs.map((c) => ({
      url: c.source_url,
      where: `${slug(c.pathway_id)} / custo "${c.label_pt}"`,
    })),
  ];
  const byUrl = new Map<string, string[]>();
  for (const source of sources)
    byUrl.set(source.url, [...(byUrl.get(source.url) ?? []), source.where]);

  let broken = 0;
  if (!SKIP_HTTP) {
    console.log(`\n== Fontes (${byUrl.size} URLs únicas) ==`);
    const urls = [...byUrl.keys()];
    const results = await mapLimit(urls, CONCURRENCY, checkUrl);
    urls.forEach((target, i) => {
      const { status, note } = results[i]!;
      const blocked = status === 403 || status === 429;
      const ok = typeof status === "number" && status < 400;
      if (ok) return;
      const label = blocked ? "AVISO" : "QUEBRADO";
      if (!blocked) broken++;
      const uses = byUrl.get(target) ?? [];
      console.log(`[${label}] ${status}${note ? ` (${note})` : ""} ${target}`);
      if (blocked) console.log("        o site bloqueia acesso automatizado: confira no navegador");
      console.log(
        `        usado em: ${uses.slice(0, 3).join("; ")}${uses.length > 3 ? ` e mais ${uses.length - 3}` : ""}`,
      );
    });
    if (broken === 0) console.log("Nenhum link quebrado.");
  }

  // --- stale content
  const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const dated: Dated[] = [
    ...data.pathways.map((p) => ({
      where: `caminho ${p.slug} [${p.status}]`,
      verifiedAt: p.last_verified_at,
    })),
    ...data.requirements.map((r) => ({
      where: `${slug(r.pathway_id)} / requisito ${r.key}`,
      verifiedAt: r.last_verified_at,
    })),
    ...data.costs.map((c) => ({
      where: `${slug(c.pathway_id)} / custo "${c.label_pt}"`,
      verifiedAt: c.last_verified_at,
    })),
  ];
  const stale = dated.filter((d) => !d.verifiedAt || new Date(d.verifiedAt).getTime() < cutoff);
  console.log(`\n== Verificação com mais de ${STALE_DAYS} dias (${stale.length}) ==`);
  for (const item of stale) {
    console.log(
      `- ${item.where}: ${item.verifiedAt ? item.verifiedAt.slice(0, 10) : "nunca verificado"}`,
    );
  }

  // --- rules
  const invalid = data.requirements
    .map((r) => ({ r, result: parseRule(r.rule) }))
    .filter(({ result }) => !result.ok);
  console.log(`\n== Regras (${data.requirements.length}, inválidas: ${invalid.length}) ==`);
  for (const { r, result } of invalid) {
    console.log(`- ${slug(r.pathway_id)} / ${r.key}: ${result.ok ? "" : result.error}`);
  }

  const failed = broken > 0 || invalid.length > 0;
  console.log(failed ? "\nResultado: há problemas a corrigir." : "\nResultado: tudo certo.");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
