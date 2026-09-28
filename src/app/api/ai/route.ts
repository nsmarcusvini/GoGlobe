import { NextResponse, type NextRequest } from "next/server";
import { track } from "@/lib/analytics/track";
import { isAdviceRequest } from "@/lib/ai/guard";
import { encodeEvent, type CitedSource, type StreamEvent } from "@/lib/ai/protocol";
import { buildUserTurn, trimHistory, type ChatTurn, type SourceChunk } from "@/lib/ai/prompt";
import { aiConfig, retrieve } from "@/lib/ai/server";
import { getSession } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/billing/plan";
import { hasSupabaseConfig } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "@/lib/zod";

export const maxDuration = 60;

const Turn = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

const Body = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("chat"),
    messages: z.array(Turn).min(1).max(20),
    pathway: z.string().max(100).optional(),
  }),
  z.object({ mode: z.literal("summary"), pathway: z.string().min(1).max(100) }),
  z.object({ mode: z.literal("checklist_order"), planId: z.uuid() }),
]);

function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

type Pathway = { id: string; name: string };

export async function POST(request: NextRequest) {
  const config = aiConfig();
  if (!config.enabled || !hasSupabaseConfig()) return fail(404, "Assistente indisponível.");
  if (!config.model) return fail(503, "O assistente está temporariamente indisponível.");

  const { supabase, user } = await getSession();
  if (!user) return fail(401, "Entre na sua conta para usar o assistente.");

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Pedido inválido.");
  const body = parsed.data;

  if (!(await getEntitlements(supabase)).isPro) {
    return fail(403, "O assistente é um recurso do plano Pro.");
  }
  if (!(await rateLimit(`ai:${user.id}`, 8, 60))) {
    return fail(429, "Muitas perguntas seguidas. Aguarde um minuto.");
  }

  // Context: which pathways the excerpts may come from, and what to ask.
  let pathways: Pathway[] = [];
  let query = "";
  let userTurn: (sources: SourceChunk[]) => string;
  let history: ChatTurn[] = [];
  let adviceRequest = false;

  if (body.mode === "chat") {
    const { data: plans } = await supabase
      .from("user_plans")
      .select("pathway:pathways!inner(id, slug, name_pt)");
    pathways = (plans ?? [])
      .map((p) => p.pathway as unknown as { id: string; slug: string; name_pt: string })
      .filter((p) => !body.pathway || p.slug === body.pathway)
      .map((p) => ({ id: p.id, name: p.name_pt }));
    if (pathways.length === 0) {
      return fail(409, "Acompanhe um caminho para perguntar sobre ele.");
    }
    const turns = trimHistory(body.messages);
    const last = turns.at(-1);
    if (!last || last.role !== "user") return fail(400, "Pedido inválido.");
    query = last.content;
    history = turns.slice(0, -1);
    adviceRequest = isAdviceRequest(query);
    userTurn = (sources) =>
      buildUserTurn({ mode: "chat", sources, question: query, adviceRequest });
  } else if (body.mode === "summary") {
    const { data: pathway } = await supabase
      .from("pathways")
      .select("id, name_pt")
      .eq("slug", body.pathway)
      .eq("status", "published")
      .maybeSingle();
    if (!pathway) return fail(404, "Caminho não encontrado.");
    pathways = [{ id: pathway.id, name: pathway.name_pt }];
    query = `${pathway.name_pt}: para que serve, requisitos, etapas, documentos e custos oficiais`;
    userTurn = (sources) =>
      buildUserTurn({ mode: "summary", sources, pathwayName: pathway.name_pt });
  } else {
    const { data: plan } = await supabase
      .from("user_plans")
      .select("pathway:pathways!inner(id, name_pt), items:checklist_items(title, sort_order)")
      .eq("id", body.planId)
      .maybeSingle();
    if (!plan) return fail(404, "Plano não encontrado.");
    const pathway = plan.pathway as unknown as { id: string; name_pt: string };
    const checklist = [...(plan.items ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.title)
      .slice(0, 40);
    if (checklist.length === 0) return fail(409, "Este checklist ainda não tem itens.");
    pathways = [{ id: pathway.id, name: pathway.name_pt }];
    query = `${pathway.name_pt}: ordem das etapas, prazos e pré-requisitos. ${checklist.join("; ")}`;
    userTurn = (sources) =>
      buildUserTurn({ mode: "checklist_order", sources, pathwayName: pathway.name_pt, checklist });
  }

  // Quota is spent before calling the model and given back if the call fails.
  const admin = createAdminClient();
  const { data: spent, error: quotaError } = await admin
    .rpc("consume_ai_message", { p_user: user.id, p_limit: config.quota })
    .single();
  if (quotaError || !spent) return fail(503, "O assistente está temporariamente indisponível.");
  if (!spent.allowed) {
    return fail(429, `Você usou as ${config.quota} mensagens do mês. A cota renova no dia 1º.`);
  }
  const refund = () => admin.rpc("refund_ai_message", { p_user: user.id });

  let sources: SourceChunk[];
  try {
    sources = await retrieve(
      supabase,
      config.embeddings,
      query,
      pathways,
      body.mode === "chat" ? 8 : 12,
    );
  } catch {
    await refund();
    return fail(503, "Não consegui consultar as fontes agora. Tente de novo em instantes.");
  }

  const cited: CitedSource[] = sources.map((s, i) => ({
    n: i + 1,
    url: s.url,
    title: s.title,
    origin: s.origin,
    date: s.fetched_at,
    pathway: s.pathway,
  }));
  const model = config.model;
  const messages = [...history, { role: "user" as const, content: userTurn(sources) }];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(encodeEvent(event)));
      send({
        type: "meta",
        sources: cited,
        used: spent.used,
        quota: spent.quota,
        advice: adviceRequest,
      });
      let wrote = false;
      try {
        for await (const event of model.answer({
          messages,
          sources,
          question: query,
          signal: request.signal,
        })) {
          if (event.type === "text") {
            wrote = true;
            send(event);
          } else {
            if (event.stopReason === "refusal") {
              send({
                type: "text",
                text: `${wrote ? "\n\n" : ""}Não posso responder a esta pergunta. Tente reformulá-la sobre um requisito ou etapa dos seus caminhos.`,
              });
            }
            send({ type: "done", stopReason: event.stopReason });
          }
        }
        await track("ai_message", { userId: user.id, props: { mode: body.mode } });
      } catch {
        if (!wrote) await refund();
        send({
          type: "error",
          message: wrote
            ? "A resposta foi interrompida. Tente de novo."
            : "Não consegui responder agora. Esta mensagem não foi descontada da sua cota.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
