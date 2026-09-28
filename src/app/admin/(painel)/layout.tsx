import { redirect } from "next/navigation";
import { signOutAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { checkAdmin } from "@/lib/auth/session";

/** Guards every curation page. Server Actions re-check the role independently. */
export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await checkAdmin();
  if (session.status === "anonymous") redirect("/admin/entrar");
  if (session.status === "forbidden") {
    return (
      <div className="grid max-w-lg gap-4 py-12">
        <h1 className="type-title">Sem permissão</h1>
        <p className="text-ink-muted">
          A conta {session.email} não tem papel de admin. Peça acesso ao responsável pelo conteúdo.
        </p>
        <form action={signOutAdmin}>
          <Button variant="secondary">Sair</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="type-mono flex flex-wrap items-center justify-end gap-3 text-ink-muted">
        <span>{session.email}</span>
        <form action={signOutAdmin}>
          <Button variant="ghost" className="h-8 px-3">
            Sair
          </Button>
        </form>
      </div>
      {children}
    </div>
  );
}
