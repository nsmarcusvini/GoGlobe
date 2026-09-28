// Grants the admin role to a user by e-mail (creates the user if missing).
// Usage: npm run make-admin -- pessoa@exemplo.com
// Uses the service role key from .env.local. Point it at the local stack for
// development; running it against production requires explicit intent.

import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const email = process.argv[2]?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Uso: npm run make-admin -- pessoa@exemplo.com");
  process.exit(2);
}
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(2);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserId(target: string): Promise<string | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  let userId = await findUserId(email!);
  if (!userId) {
    const { data, error } = await db.auth.admin.createUser({ email: email!, email_confirm: true });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Usuário criado: ${email}`);
  }
  const { error } = await db.from("profiles").update({ role: "admin" }).eq("user_id", userId);
  if (error) throw error;
  console.log(`${email} agora é admin. Entre em /admin/entrar com esse e-mail.`);
  if (url!.includes("127.0.0.1") || url!.includes("localhost")) {
    console.log("Local: o link mágico chega no Mailpit em http://127.0.0.1:54324");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
