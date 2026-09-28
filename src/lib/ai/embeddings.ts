// Embedding providers. Voyage AI in production (Anthropic has no embeddings
// endpoint and recommends Voyage); a deterministic lexical "hash" provider for
// tests and for running without a key. Vectors from different models are never
// compared: every chunk stores its model and the search filters by it.
// Dependency-free so the ingestion script (plain Node) can import it.

export const EMBEDDING_DIMENSIONS = 1024;

export type EmbeddingKind = "document" | "query";

export interface EmbeddingProvider {
  readonly model: string;
  embed(texts: string[], kind: EmbeddingKind): Promise<number[][]>;
}

const STOPWORDS = new Set(
  "que para com uma por dos das nos nas não sim como mais sua seu ser tem são the and for with you your are this that from have what which who when where".split(
    " ",
  ),
);

/** Lowercase, accent-free word stems (naive plural trim), for the mock provider. */
export function tokens(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
}

function fnv(text: string, seed: number): number {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vector : vector.map((v) => v / norm);
}

/** Bag-of-words hashed into a fixed vector. Deterministic, offline, lexical only. */
export const hashEmbeddings: EmbeddingProvider = {
  model: "mock-hash-1024",
  async embed(texts) {
    return texts.map((text) => {
      const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
      for (const token of tokens(text)) {
        const index = fnv(token, 0) % EMBEDDING_DIMENSIONS;
        vector[index]! += fnv(token, 7) & 1 ? 1 : -1;
      }
      return normalize(vector);
    });
  },
};

export function voyageEmbeddings(apiKey: string, model = "voyage-3.5"): EmbeddingProvider {
  return {
    model,
    async embed(texts, kind) {
      const out: number[][] = [];
      // Voyage accepts up to 1000 inputs per call; smaller batches keep payloads light.
      for (let i = 0; i < texts.length; i += 64) {
        const response = await fetch("https://api.voyageai.com/v1/embeddings", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            input: texts.slice(i, i + 64),
            model,
            input_type: kind,
            output_dimension: EMBEDDING_DIMENSIONS,
          }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`Voyage ${response.status}: ${await response.text()}`);
        const { data } = (await response.json()) as {
          data: { embedding: number[]; index: number }[];
        };
        out.push(...data.sort((a, b) => a.index - b.index).map((d) => d.embedding));
      }
      return out;
    },
  };
}

/** Voyage when VOYAGE_API_KEY is set, otherwise the offline hash provider. */
export function embeddingProvider(env: {
  VOYAGE_API_KEY?: string;
  VOYAGE_MODEL?: string;
}): EmbeddingProvider {
  return env.VOYAGE_API_KEY
    ? voyageEmbeddings(env.VOYAGE_API_KEY, env.VOYAGE_MODEL)
    : hashEmbeddings;
}

/** pgvector text literal. */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((v) => Number(v.toFixed(6))).join(",")}]`;
}
