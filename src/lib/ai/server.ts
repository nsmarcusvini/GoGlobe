import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { serverEnv } from "@/lib/env.server";
import { embeddingProvider, toVectorLiteral, type EmbeddingProvider } from "./embeddings";
import { anthropicModel, DEFAULT_MODEL, mockModel, type AnswerModel } from "./model";
import type { SourceChunk } from "./prompt";

export const DEFAULT_MONTHLY_QUOTA = 100;

export type AiConfig = {
  enabled: boolean;
  quota: number;
  model: AnswerModel | null;
  embeddings: EmbeddingProvider;
};

/**
 * Feature flag, quota and providers. Without an Anthropic key the offline mock
 * answers in development or when AI_MOCK=true; in production it stays off.
 */
export function aiConfig(): AiConfig {
  const env = serverEnv();
  const useMock = env.AI_MOCK || process.env.NODE_ENV !== "production";
  const model = env.ANTHROPIC_API_KEY
    ? anthropicModel(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL ?? DEFAULT_MODEL)
    : useMock
      ? mockModel
      : null;
  return {
    enabled: env.AI_ENABLED,
    quota: env.AI_MONTHLY_MESSAGE_QUOTA ?? DEFAULT_MONTHLY_QUOTA,
    model,
    embeddings: embeddingProvider(env),
  };
}

/** Flag only, without validating the rest of the server env (safe in layouts). */
export function aiEnabled(): boolean {
  return process.env.AI_ENABLED === "true";
}

type Client = SupabaseClient<Database>;

/** What the assistant UI needs for the signed-in user. */
export async function assistantState(supabase: Client) {
  const [{ data: isPro }, used, { data: plans }] = await Promise.all([
    supabase.rpc("is_pro", {}),
    monthlyUsage(supabase),
    supabase.from("user_plans").select("pathway:pathways!inner(slug, name_pt)").order("created_at"),
  ]);
  const parsed = Number(process.env.AI_MONTHLY_MESSAGE_QUOTA);
  return {
    isPro: isPro === true,
    used,
    quota: Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MONTHLY_QUOTA,
    pathways: (plans ?? []).map((p) => {
      const pathway = p.pathway as unknown as { slug: string; name_pt: string };
      return { slug: pathway.slug, name: pathway.name_pt };
    }),
  };
}

/** Most similar excerpts from the given pathways (RLS still applies). */
export async function retrieve(
  supabase: Client,
  embeddings: EmbeddingProvider,
  query: string,
  pathways: { id: string; name: string }[],
  count = 8,
): Promise<SourceChunk[]> {
  if (pathways.length === 0) return [];
  const [vector] = await embeddings.embed([query], "query");
  const { data, error } = await supabase.rpc("match_source_chunks", {
    query_embedding: toVectorLiteral(vector!),
    pathway_ids: pathways.map((p) => p.id),
    model: embeddings.model,
    match_count: count,
  });
  if (error) throw new Error(error.message);
  const names = new Map(pathways.map((p) => [p.id, p.name]));
  return (data ?? []).map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    origin: row.origin,
    content: row.content,
    fetched_at: row.fetched_at,
    pathway: names.get(row.pathway_id) ?? "",
  }));
}

/** Monthly usage for the signed-in user (RLS: owner read). */
export async function monthlyUsage(supabase: Client): Promise<number> {
  const { data: period } = await supabase.rpc("ai_period_start");
  if (!period) return 0;
  const { data } = await supabase
    .from("ai_usage")
    .select("messages_used")
    .eq("period_start", period)
    .maybeSingle();
  return data?.messages_used ?? 0;
}
