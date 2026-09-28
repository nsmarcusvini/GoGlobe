import { describe, expect, it } from "vitest";
import { EMBEDDING_DIMENSIONS, hashEmbeddings, toVectorLiteral, tokens } from "./embeddings";
import { isAdviceRequest } from "./guard";
import { encodeEvent, readEvents, type StreamEvent } from "./protocol";
import {
  BANNED_PHRASES,
  buildUserTurn,
  citedNumbers,
  formatSources,
  SYSTEM_PROMPT,
  trimHistory,
  type SourceChunk,
} from "./prompt";
import { chunkText, decodeEntities, extractText, hashText } from "./text";

const source = (over: Partial<SourceChunk> = {}): SourceChunk => ({
  id: "1",
  url: "https://immi.homeaffairs.gov.au/x",
  title: "Página",
  origin: "official_page",
  content: "You must be under 45 years of age when invited to apply.",
  fetched_at: "2026-09-28T15:00:00Z",
  pathway: "Subclasse 189",
  ...over,
});

describe("extractText", () => {
  it("keeps main content and drops scripts, navigation and escaped markup", () => {
    const html = `<html><head><title>Visa &amp; fees</title><script>var x = 1;</script></head>
      <body><nav>Menu</nav><main><h1>Skilled visa</h1><p>You must be under&nbsp;45.</p>
      <input value="&lt;p&gt;Permanently&lt;/p&gt;" /><ul><li>Fee: AUD 4,765</li></ul>
      <p>&#8203;</p>${"<p>Padding text for a real main element.</p>".repeat(5)}</main><footer>Footer</footer></body></html>`;
    const { title, text } = extractText(html);
    expect(title).toBe("Visa & fees");
    expect(text).toContain("Skilled visa\nYou must be under 45.");
    expect(text).toContain("Fee: AUD 4,765");
    expect(text).not.toMatch(/Menu|Footer|var x|<p>|​/);
  });

  it("decodes numeric and named entities, leaving unknown ones", () => {
    expect(decodeEntities("&#233;&#x20AC;&rsquo;&bogus;")).toBe("é€’&bogus;");
  });
});

describe("chunkText", () => {
  it("packs lines up to the limit with overlap between chunks", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Line number ${i} has some words.`).join(
      "\n",
    );
    const chunks = chunkText(text, { maxChars: 200, overlapChars: 40 });
    expect(chunks.length).toBeGreaterThan(3);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(200);
    expect(chunks[1]).toContain("Line number 5");
    // The start of each chunk repeats the end of the previous one.
    const tail = chunks[0]!.slice(-20).trim().split(" ").at(-1)!;
    expect(chunks[1]!.slice(0, 60)).toContain(tail);
  });

  it("splits a very long line on sentences", () => {
    const line = "Sentence one is here. ".repeat(40);
    const chunks = chunkText(line, { maxChars: 100, overlapChars: 0 });
    expect(chunks.every((c) => c.length <= 100)).toBe(true);
    expect(chunks.join(" ")).toContain("Sentence one is here.");
  });

  it("returns nothing for empty text and hashes stably", () => {
    expect(chunkText("  \n ")).toEqual([]);
    expect(hashText("abc")).toBe(hashText("abc"));
    expect(hashText("abc")).not.toBe(hashText("abd"));
  });
});

describe("hash embeddings", () => {
  it("are normalised, deterministic and closer for shared words", async () => {
    const [a, b, c] = await hashEmbeddings.embed(
      ["idade máxima para o visto", "Qual a idade maxima?", "taxa de inscrição do exame"],
      "document",
    );
    const dot = (x: number[], y: number[]) => x.reduce((s, v, i) => s + v * y[i]!, 0);
    expect(a).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(dot(a!, a!)).toBeCloseTo(1, 5);
    expect(dot(a!, b!)).toBeGreaterThan(dot(a!, c!));
    const [again] = await hashEmbeddings.embed(["idade máxima para o visto"], "query");
    expect(again).toEqual(a);
  });

  it("tokenises without accents, stopwords or plural s", () => {
    expect(tokens("Os Requisitos para Inglês")).toEqual(["requisito", "ingle"]);
    expect(toVectorLiteral([0.1234567, -1])).toBe("[0.123457,-1]");
  });
});

describe("advice guard", () => {
  it.each([
    "Qual visto devo escolher, 189 ou 190?",
    "Quais são minhas chances de ser aprovado?",
    "Eu vou conseguir o visto com 30 anos?",
    "Sou elegível para o Express Entry?",
    "Quantos pontos eu tenho?",
    "Devo aplicar agora ou esperar?",
    "Qual o melhor país para enfermeiros?",
  ])("flags %s", (q) => expect(isAdviceRequest(q)).toBe(true));

  it.each([
    "Qual a idade máxima para o visto 189?",
    "Quais testes de inglês são aceitos?",
    "Quanto custa a taxa do visto?",
  ])("lets %s through", (q) => expect(isAdviceRequest(q)).toBe(false));
});

describe("prompt", () => {
  it("system prompt is static and states every rule", () => {
    expect(SYSTEM_PROMPT).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    for (const rule of ["[1]", "Não encontrei", "MARA/RMA", "IAA/LIA", "RCIC", ...BANNED_PHRASES]) {
      expect(SYSTEM_PROMPT).toContain(rule);
    }
  });

  it("numbers sources with url, origin and Brasília date, escaping markup", () => {
    const text = formatSources([source({ content: "a < b" }), source({ origin: "curated" })]);
    expect(text).toContain('<source n="1" pathway="Subclasse 189" origin="official_page"');
    expect(text).toContain('date="28/09/2026"');
    expect(text).toContain("a &lt; b");
    expect(text).toContain('n="2"');
    expect(formatSources([])).toContain("nenhum trecho");
  });

  it("builds each mode's turn", () => {
    const chat = buildUserTurn({
      mode: "chat",
      sources: [source()],
      question: "Idade?",
      adviceRequest: true,
    });
    expect(chat).toMatch(/<question>\nIdade\?\n<\/question>/);
    expect(chat).toContain("<note>");
    const summary = buildUserTurn({ mode: "summary", sources: [], pathwayName: "189" });
    expect(summary).toContain("<pathway>189</pathway>");
    expect(summary).toContain("linguagem simples");
    const order = buildUserTurn({
      mode: "checklist_order",
      sources: [],
      checklist: ["Passaporte", "Exame"],
    });
    expect(order).toContain("- Passaporte\n- Exame");
    expect(order).toContain("não decida elegibilidade");
  });

  it("trims history to recent turns starting with the user", () => {
    const turns = Array.from({ length: 9 }, (_, i) => ({
      role: i % 2 ? ("assistant" as const) : ("user" as const),
      content: String(i),
    }));
    const trimmed = trimHistory(turns, 6);
    expect(trimmed[0]!.role).toBe("user");
    expect(trimmed.at(-1)!.content).toBe("8");
  });

  it("reads citation numbers", () => {
    expect(citedNumbers("A [2]. B [1][2]. C [10].")).toEqual([1, 2, 10]);
  });
});

describe("protocol", () => {
  it("round-trips events split across arbitrary chunks", async () => {
    const events: StreamEvent[] = [
      { type: "meta", sources: [], used: 1, quota: 100, advice: false },
      { type: "text", text: "Olá [1]\n" },
      { type: "done", stopReason: "end_turn" },
    ];
    const wire = events.map(encodeEvent).join("");
    const bytes = new TextEncoder().encode(wire);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
        controller.close();
      },
    });
    const out: StreamEvent[] = [];
    for await (const event of readEvents(body)) out.push(event);
    expect(out).toEqual(events);
  });
});
