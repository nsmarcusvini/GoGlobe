import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LegalNotice } from "@/components/legal-notice";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PathwayCard } from "@/components/ui/pathway-card";
import { ProgressRoute } from "@/components/ui/progress-route";
import { SourceBlock } from "@/components/ui/source-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { REQUIREMENT_STATUSES } from "@/lib/eligibility";

// Internal design-system showcase for review. Not linked and not indexed.
export const metadata: Metadata = {
  title: "Sistema de design",
  robots: { index: false, follow: false },
};

const SWATCHES = [
  { name: "Abissal", token: "--abissal", hex: "#0B2545" },
  { name: "Safira", token: "--safira", hex: "#226F96" },
  { name: "Esmeralda", token: "--esmeralda", hex: "#198258" },
  { name: "Glacial", token: "--glacial", hex: "#F4F7F6" },
  { name: "Branco", token: "--branco", hex: "#FFFFFF" },
];

function Block({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-8 border-t border-line pt-10 lg:grid-cols-[14rem_1fr]">
      <header className="grid content-start gap-2">
        <span className="type-mono text-green-ink">{index}</span>
        <h2 className="type-title text-2xl">{title}</h2>
      </header>
      <div className="grid gap-6">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="container-page grid gap-16 py-20">
      <header className="grid gap-4">
        <p className="type-eyebrow">GoGlobe · Rota Traçada</p>
        <h1 className="type-display">Sistema de design</h1>
        <p className="type-lead">
          Tokens e componentes-base usados no site e no app. Alterne o tema no topo da página para
          conferir claro e escuro.
        </p>
      </header>

      <Block index="01" title="Cor">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {SWATCHES.map((s) => (
            <li key={s.token} className="grid gap-2">
              <span
                className="aspect-[4/3] rounded-sm shadow-[inset_0_0_0_1px_var(--line)]"
                style={{ background: `var(${s.token})` }}
              />
              <span className="font-semibold">{s.name}</span>
              <span className="type-mono text-ink-muted">{s.hex}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block index="02" title="Tipografia">
        <p className="type-mega">Aa Rota</p>
        <p className="type-display">Display: Bricolage Grotesque</p>
        <p className="type-title">Título: condensado, pesado, apertado</p>
        <p className="type-lead">
          Lead: corpo maior para introduções e resumos, em cor secundária.
        </p>
        <p className="max-w-(--measure)">
          Corpo: Bricolage Grotesque em largura normal, 17px, entrelinha 1.6 e medida de até 65
          caracteres por linha. Legível no celular, confortável em textos longos.
        </p>
        <p className="type-mono">Mono · JetBrains · 35°17′S 149°08′E · Subclass 000 · 28/09/2026</p>
        <p className="type-eyebrow">Eyebrow · rótulo de seção</p>
      </Block>

      <Block index="03" title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button arrow size="lg">
            Criar meu perfil grátis
          </Button>
          <Button variant="secondary" size="lg">
            Secundário
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Desabilitado</Button>
          <ButtonLink href="/design" variant="secondary" arrow>
            Link como botão
          </ButtonLink>
        </div>
      </Block>

      <Block index="04" title="Campos">
        <div className="grid max-w-md gap-6">
          <Field
            label="Profissão"
            placeholder="Ex.: enfermeira, desenvolvedor"
            hint="Em português mesmo."
          />
          <Field
            label="Anos de experiência"
            type="number"
            defaultValue={-1}
            error="Informe um número igual ou maior que zero."
          />
        </div>
      </Block>

      <Block index="05" title="Status de requisito">
        <div className="flex flex-wrap gap-3">
          {REQUIREMENT_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {REQUIREMENT_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} showHint />
          ))}
        </div>
      </Block>

      <Block index="06" title="Progresso">
        <ProgressRoute value={3} max={5} steps={5} label="Seu perfil" className="max-w-md" />
        <ProgressRoute value={7} max={18} label="Checklist" className="max-w-md" />
      </Block>

      <Block index="07" title="Fonte oficial">
        <SourceBlock url="https://immi.homeaffairs.gov.au/" verifiedAt="2026-09-28T00:00:00Z" />
      </Block>

      <Block index="08" title="Card de caminho">
        <p className="type-mono text-ink-muted">
          Conteúdo fictício, apenas para mostrar o componente.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <PathwayCard
            href="/design"
            countryCode="AU"
            officialName="Programa de exemplo"
            namePt="Caminho de exemplo: trabalho qualificado"
            categoryLabel="Trabalho"
            summary="Resumo em português claro do que o caminho é, para quem foi pensado e o que exige, sempre a partir do texto oficial."
            sourceUrl="https://immi.homeaffairs.gov.au/"
            verifiedAt="2026-09-28T00:00:00Z"
          />
          <PathwayCard
            href="/design"
            countryCode="CA"
            officialName="Programa de exemplo"
            namePt="Caminho de exemplo com resumo"
            categoryLabel="Residência"
            summary="Versão usada nos resultados logados: mostra quantos requisitos batem com o que a pessoa informou."
            sourceUrl="https://www.canada.ca/en/immigration-refugees-citizenship.html"
            verifiedAt="2026-09-28T00:00:00Z"
            summaryCounts={{ meets: 5, total: 8, hardFails: 1, manual: 2 }}
          />
        </div>
      </Block>

      <Block index="09" title="Aviso legal">
        <LegalNotice />
        <LegalNotice variant="inline" />
      </Block>
    </div>
  );
}
