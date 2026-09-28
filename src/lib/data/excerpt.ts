// Pure helper for /sobre: pulls a short, verbatim block out of an ingested
// official page, or nothing when the page layout changed.

/** The IELTS Academic block of the official "competent English" page. */
export function extractExcerpt(content: string): string[] | null {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const start = lines.findIndex((l) => /\(IELTS Academic\)\s*$/.test(l));
  if (start < 0) return null;
  const rule = lines.findIndex((l, i) => i > start && /^In each of the 4 test components/.test(l));
  if (rule < 0) return null;
  const scores = lines.slice(rule + 1, rule + 5);
  if (
    scores.length < 4 ||
    !scores.every((l) => /^\d+(\.\d+)? for (listening|reading|writing|speaking)$/.test(l))
  ) {
    return null;
  }
  return [
    lines[start]!.replace(/^.*?(International English Language Testing System)/, "$1"),
    lines[rule]!,
    ...scores,
  ];
}
