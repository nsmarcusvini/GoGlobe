import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Current user (validated with the Auth server) plus a request-scoped client. */
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export type AdminCheck =
  | { status: "anonymous" }
  | { status: "forbidden"; email: string | undefined }
  | { status: "admin"; email: string | undefined; userId: string };

/** Admin check used by layouts and, again, by every admin Server Action. */
export async function checkAdmin(): Promise<
  AdminCheck & { supabase: Awaited<ReturnType<typeof createClient>> }
> {
  const { supabase, user } = await getSession();
  if (!user) return { status: "anonymous", supabase };
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return { status: "forbidden", email: user.email, supabase };
  return { status: "admin", email: user.email, userId: user.id, supabase };
}

/** Only relative, same-site paths are allowed as post-login destinations. */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
