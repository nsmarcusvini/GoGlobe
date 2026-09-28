"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/actions";
import { fieldErrors } from "@/lib/admin/schemas";
import { track } from "@/lib/analytics/track";
import { safeNextPath } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { z } from "@/lib/zod";

const EmailInput = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  next: z.string().optional(),
});

function callbackUrl(next: string) {
  const url = new URL("/auth/callback", publicEnv().NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("next", next);
  return url.toString();
}

/** Magic link: signs in existing users and creates the account for new ones. */
export async function sendMagicLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = EmailInput.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const next = safeNextPath(parsed.data.next, "/app/onboarding");
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: true, emailRedirectTo: callbackUrl(next) },
  });
  if (error) {
    return {
      ok: false,
      message:
        error.status === 429
          ? "Muitas tentativas. Aguarde um minuto e tente de novo."
          : "Não foi possível enviar o link. Tente de novo.",
    };
  }
  await track("signup_started", { path: "/entrar" });
  return { ok: true, message: `Enviamos um link de acesso para ${parsed.data.email}.` };
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? ""), "/app/onboarding");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next) },
  });
  if (error || !data.url) redirect("/entrar?erro=google");
  redirect(data.url);
}
