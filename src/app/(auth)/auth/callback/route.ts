import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { track } from "@/lib/analytics/track";
import { safeNextPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback for magic links and OAuth.
 * Supports the PKCE `code` flow and the `token_hash` + `type` email flow.
 * `next` must be a relative path (prevents open redirects).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"), "/");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (ok) {
    // A brand-new account (created in the last 15 minutes) completed sign-up.
    const { data } = await supabase.auth.getUser();
    const created = data.user ? Date.parse(data.user.created_at) : 0;
    if (data.user && Date.now() - created < 15 * 60 * 1000) {
      await track("signup_completed", { userId: data.user.id });
    }
  }

  const target = ok ? next : `/entrar?erro=link-invalido`;
  return NextResponse.redirect(new URL(target, origin));
}
