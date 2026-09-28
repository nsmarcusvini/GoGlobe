import "server-only";
import { extractExcerpt } from "@/lib/data/excerpt";
import { createPublicClient } from "@/lib/supabase/public";

// Data for /sobre: one real requirement traced from the official page to the
// app, plus live counts. Everything comes from the database; when it isn't
// available (e.g. a build without Supabase), the page explains the method
// without the example instead of inventing one.

export const TRACE_PATHWAY = "skilled-independent-189";
export const TRACE_KEY = "english";
export const RECHECK_DAYS = 90;

export type TraceExample = {
  pathway: string;
  countryCode: string;
  label: string;
  description: string | null;
  rule: unknown;
  sourceUrl: string;
  verifiedAt: string;
  fetchedAt: string | null;
  /** Lines copied from the official page as read by the ingestion. */
  excerpt: string[] | null;
};

export type AboutStats = {
  pathways: number;
  requirements: number;
  sources: number;
  lastVerified: string | null;
};

export async function loadAbout(): Promise<{
  example: TraceExample | null;
  stats: AboutStats | null;
}> {
  const db = createPublicClient();
  if (!db) return { example: null, stats: null };

  const [{ data: pathway }, { data: reqs }] = await Promise.all([
    db
      .from("pathways")
      .select(
        "id, name_pt, country:countries!inner(code), requirements(key, label_pt, description_pt, rule, source_url, last_verified_at)",
      )
      .eq("slug", TRACE_PATHWAY)
      .eq("status", "published")
      .maybeSingle(),
    db
      .from("requirements")
      .select("source_url, last_verified_at, pathway:pathways!inner(status)")
      .eq("pathway.status", "published"),
  ]);

  const { count: pathways } = await db
    .from("pathways")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const stats: AboutStats | null = reqs
    ? {
        pathways: pathways ?? 0,
        requirements: reqs.length,
        sources: new Set(reqs.map((r) => r.source_url)).size,
        lastVerified:
          reqs
            .map((r) => r.last_verified_at)
            .sort()
            .at(-1) ?? null,
      }
    : null;

  const req = pathway?.requirements.find((r) => r.key === TRACE_KEY);
  if (!pathway || !req) return { example: null, stats };

  const { data: chunks } = await db
    .from("source_chunks")
    .select("content, fetched_at")
    .eq("pathway_id", pathway.id)
    .eq("url", req.source_url)
    .eq("origin", "official_page")
    .ilike("content", "%(IELTS Academic)%")
    .order("chunk_index")
    .limit(3);
  const hit = (chunks ?? [])
    .map((c) => ({ excerpt: extractExcerpt(c.content), fetchedAt: c.fetched_at }))
    .find((c) => c.excerpt);

  return {
    stats,
    example: {
      pathway: pathway.name_pt,
      countryCode: (pathway.country as unknown as { code: string }).code,
      label: req.label_pt,
      description: req.description_pt,
      rule: req.rule,
      sourceUrl: req.source_url,
      verifiedAt: req.last_verified_at,
      fetchedAt: hit?.fetchedAt ?? null,
      excerpt: hit?.excerpt ?? null,
    },
  };
}
