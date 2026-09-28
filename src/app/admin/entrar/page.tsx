import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sendAdminMagicLink } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { TextField } from "@/components/admin/controls";
import { checkAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Entrar" };

export default async function AdminSignInPage() {
  const session = await checkAdmin();
  if (session.status === "admin") redirect("/admin");

  return (
    <div className="mx-auto grid max-w-md gap-8 py-12">
      <header className="grid gap-3">
        <p className="type-eyebrow">Admin</p>
        <h1 className="type-title">Entrar na curadoria</h1>
        <p className="text-ink-muted">
          Enviamos um link de acesso para o e-mail. Só contas com papel de admin entram aqui.
        </p>
      </header>
      {session.status === "forbidden" && (
        <p role="alert" className="rounded-sm bg-(--status-fails-bg) p-4 text-(--status-fails)">
          A conta {session.email} não tem permissão de admin.
        </p>
      )}
      <ActionForm action={sendAdminMagicLink} submitLabel="Enviar link de acesso">
        <TextField name="email" type="email" label="E-mail" autoComplete="email" required />
      </ActionForm>
    </div>
  );
}
