import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guardrail for every pt-BR string in src/content: the product never
// recommends a pathway (MVP spec, section 2) and ships no placeholder text.
const dir = join(process.cwd(), "src/content");
const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ");

const BANNED = [
  "recomendado para voce",
  "recomendamos",
  "melhor opcao",
  "voce deve aplicar",
  "garantimos",
  "aprovacao garantida",
  "lorem",
];

// A phrase is allowed only when its sentence denies it ("não dizemos ...").
const NEGATED = /\b(nao|nunca)\b[^.]{0,80}$/;

function offenders(text: string, phrase: string): number {
  return [...text.matchAll(new RegExp(phrase, "g"))].filter(
    (m) => !NEGATED.test(text.slice(Math.max(0, m.index - 80), m.index)),
  ).length;
}

describe("content copy", () => {
  it.each(files)("%s has no banned or placeholder phrases", (file) => {
    const source = readFileSync(join(dir, file), "utf8").replace(/^\s*\/\/.*$/gm, "");
    const text = normalize(source);
    for (const phrase of BANNED) expect(offenders(text, phrase), phrase).toBe(0);
  });

  it("flags an affirmative banned phrase and allows a denied one", () => {
    const phrase = "recomendado para voce";
    expect(offenders(normalize("Este é o visto recomendado para você."), phrase)).toBe(1);
    expect(offenders(normalize("Não dizemos qual é o recomendado para você."), phrase)).toBe(0);
  });
});
