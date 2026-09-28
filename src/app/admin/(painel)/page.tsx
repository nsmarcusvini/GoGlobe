import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/admin/schemas";
import { checkAdmin } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Caminhos" };

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const STALE_MS = 90 * 24 * 60 * 60 * 1000;

/** Verification older than 90 days (or never). Request-time check, outside render. */
function staleChecker() {
  const now = Date.now();
  return (verifiedAt: string | null) =>
    !verifiedAt || now - new Date(verifiedAt).getTime() > STALE_MS;
}

export default async function AdminPathwaysPage() {
  const { supabase } = await checkAdmin();
  const { data: pathways, error } = await supabase
    .from("pathways")
    .select(
      "id, slug, name_pt, official_name, category, status, version, last_verified_at, countries(code, name_pt), requirements(count)",
    )
    .order("slug");

  if (error) {
    return <p role="alert">Não foi possível carregar os caminhos: {error.message}</p>;
  }

  const byCountry = new Map<string, typeof pathways>();
  for (const pathway of pathways) {
    const code = pathway.countries?.code ?? "??";
    byCountry.set(code, [...(byCountry.get(code) ?? []), pathway]);
  }
  const isStale = staleChecker();
  const counts = {
    published: pathways.filter((p) => p.status === "published").length,
    draft: pathways.filter((p) => p.status === "draft").length,
    stale: pathways.filter((p) => isStale(p.last_verified_at)).length,
  };

  return (
    <div className="grid gap-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid gap-2">
          <h1 className="type-title">Caminhos</h1>
          <p className="type-mono text-ink-muted">
            {counts.published} publicados · {counts.draft} rascunhos · {counts.stale} com
            verificação acima de 90 dias
          </p>
        </div>
        <ButtonLink href="/admin/caminhos/novo" arrow>
          Novo caminho
        </ButtonLink>
      </header>

      {["AU", "NZ", "CA", ...[...byCountry.keys()].filter((c) => !["AU", "NZ", "CA"].includes(c))]
        .filter((code) => byCountry.has(code))
        .map((code) => {
          const list = byCountry.get(code) ?? [];
          return (
            <section key={code} aria-labelledby={`country-${code}`} className="grid gap-3">
              <h2 id={`country-${code}`} className="type-eyebrow">
                {list[0]?.countries?.name_pt} · {list.length}
              </h2>
              <div className="overflow-x-auto rounded-md shadow-[inset_0_0_0_1px_var(--line)]">
                <table className="w-full min-w-[44rem] text-left text-[0.9375rem]">
                  <thead className="type-mono text-ink-muted">
                    <tr className="border-b border-line">
                      <th scope="col" className="px-4 py-3 font-medium">
                        Caminho
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Categoria
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Requisitos
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Versão
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Verificado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((pathway) => {
                      const stale = isStale(pathway.last_verified_at);
                      return (
                        <tr
                          key={pathway.id}
                          className="border-b border-line last:border-b-0 hover:bg-surface-sunk"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/caminhos/${pathway.id}`}
                              className="link-inline font-semibold"
                            >
                              {pathway.name_pt}
                            </Link>
                            <div className="type-mono text-ink-muted">{pathway.official_name}</div>
                          </td>
                          <td className="px-4 py-3">{CATEGORY_LABELS[pathway.category]}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "type-mono rounded-xs px-2 py-1",
                                pathway.status === "published" &&
                                  "bg-(--status-meets-bg) text-(--status-meets)",
                                pathway.status === "draft" &&
                                  "bg-(--status-info-bg) text-(--status-info)",
                                pathway.status === "archived" && "bg-surface-sunk text-ink-muted",
                              )}
                            >
                              {STATUS_LABELS[pathway.status]}
                            </span>
                          </td>
                          <td className="type-mono px-4 py-3">
                            {pathway.requirements[0]?.count ?? 0}
                          </td>
                          <td className="type-mono px-4 py-3">v{pathway.version}</td>
                          <td
                            className={cn("type-mono px-4 py-3", stale && "text-(--status-fails)")}
                          >
                            {pathway.last_verified_at
                              ? dateFormat.format(new Date(pathway.last_verified_at))
                              : "nunca"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
    </div>
  );
}
