import type { Metadata } from "next";
import Link from "next/link";
import { savePathway } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { PathwayFields } from "@/components/admin/pathway-fields";
import { checkAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Novo caminho" };

export default async function NewPathwayPage() {
  const { supabase } = await checkAdmin();
  const { data: countries } = await supabase
    .from("countries")
    .select("id, code, name_pt")
    .order("code");

  return (
    <div className="grid max-w-4xl gap-8">
      <header className="grid gap-2">
        <Link href="/admin" className="type-mono link-route w-fit text-ink-muted">
          ← Caminhos
        </Link>
        <h1 className="type-title">Novo caminho</h1>
        <p className="text-ink-muted">
          Começa como rascunho. Publique só depois de conferir tudo na fonte oficial.
        </p>
      </header>
      <ActionForm action={savePathway.bind(null, null)} submitLabel="Criar rascunho">
        <PathwayFields countries={countries ?? []} />
      </ActionForm>
    </div>
  );
}
