// Plain-text extraction and chunking for official pages. Pure functions, no
// dependencies, so the ingestion script (plain Node) can import them too.

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

const DROP = [
  "script",
  "style",
  "noscript",
  "svg",
  "nav",
  "header",
  "footer",
  "form",
  "template",
  "iframe",
];
const BLOCK =
  /<\/?(p|div|section|article|li|ul|ol|h[1-6]|tr|table|br|dt|dd|blockquote|main)\b[^>]*>/gi;

/** Readable text of an HTML page: main content when marked, without chrome. */
export function extractText(html: string): { title: string | null; text: string } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  let body = html.replace(/<!--[\s\S]*?-->/g, " ");
  const main = body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (main && main.length > 200) body = main;
  for (const tag of DROP) {
    body = body.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, "gi"), " ");
  }
  // Some CMS pages carry escaped HTML inside attributes: strip tags again after
  // decoding, plus zero-width characters.
  const text = decodeEntities(body.replace(BLOCK, "\n").replace(/<[^>]+>/g, " "))
    .replace(/<\/?[a-z][^>]*>|"?\s*\/>/gi, " ")
    .replace(/[​-‍﻿]/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 1)
    .join("\n");
  return { title: title ? decodeEntities(title).replace(/\s+/g, " ").trim() || null : null, text };
}

export type ChunkOptions = { maxChars?: number; overlapChars?: number };

/**
 * Splits text into chunks of at most `maxChars`, on line and sentence
 * boundaries, repeating the tail of the previous chunk so a fact that straddles
 * a boundary is still found.
 */
export function chunkText(
  text: string,
  { maxChars = 1200, overlapChars = 200 }: ChunkOptions = {},
): string[] {
  const pieces: string[] = [];
  for (const line of text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)) {
    if (line.length <= maxChars) {
      pieces.push(line);
      continue;
    }
    const sentences = line.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [line];
    for (const sentence of sentences) {
      const s = sentence.trim();
      for (let i = 0; i < s.length; i += maxChars) pieces.push(s.slice(i, i + maxChars));
    }
  }

  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + 1 + piece.length > maxChars) {
      chunks.push(current);
      const tail = current.slice(-overlapChars);
      const cut = tail.indexOf(" ");
      const overlap = overlapChars > 0 && cut >= 0 ? tail.slice(cut + 1) : "";
      current =
        overlap && overlap.length + 1 + piece.length <= maxChars ? `${overlap} ${piece}` : piece;
    } else {
      current = current ? `${current}\n${piece}` : piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Stable short hash (FNV-1a, hex) to detect unchanged chunks. */
export function hashText(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
