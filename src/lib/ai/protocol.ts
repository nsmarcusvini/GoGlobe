// Wire format between /api/ai and the chat UI: one JSON object per line.

export type CitedSource = {
  n: number;
  url: string;
  title: string | null;
  origin: "official_page" | "curated";
  date: string;
  pathway: string;
};

export type StreamEvent =
  | { type: "meta"; sources: CitedSource[]; used: number; quota: number; advice: boolean }
  | { type: "text"; text: string }
  | { type: "done"; stopReason: string }
  | { type: "error"; message: string };

export function encodeEvent(event: StreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

/** Reads a streamed response body as events, tolerating chunks split mid-line. */
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as StreamEvent;
      newline = buffer.indexOf("\n");
    }
    if (done) break;
  }
  if (buffer.trim()) yield JSON.parse(buffer) as StreamEvent;
}
