import { NextResponse, type NextRequest } from "next/server";
import { CLIENT_EVENTS, track, type EventName } from "@/lib/analytics/track";
import { getSession } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/zod";

const Body = z.object({
  name: z.enum(CLIENT_EVENTS as [EventName, ...EventName[]]),
  path: z.string().max(300).optional(),
  props: z
    .record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()]))
    .optional(),
});

/** Browser page-view events. Consent is checked inside track(). */
export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });

  if (!(await rateLimit(`events:${await clientIp()}`, 120, 60))) {
    return NextResponse.json({ error: "Muitas requisições." }, { status: 429 });
  }

  const userId = hasSupabaseConfig() ? (await getSession()).user?.id : null;
  await track(parsed.data.name, { userId, path: parsed.data.path, props: parsed.data.props });
  return new NextResponse(null, { status: 204 });
}
