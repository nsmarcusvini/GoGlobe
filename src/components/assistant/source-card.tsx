import { assistantCopy as t } from "@/content/assistant";
import type { CitedSource } from "@/lib/ai/protocol";
import { cn } from "@/lib/cn";
import { domainOf } from "./answer-body";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/** An official source: domain in mono, origin, and the date it was read/verified. */
export function SourceCard({
  source,
  active,
  muted = false,
}: {
  source: CitedSource;
  active: boolean;
  muted?: boolean;
}) {
  const official = source.origin === "official_page";
  return (
    <li
      id={`fonte-${source.n}`}
      data-source={source.n}
      className={cn(
        "relative grid animate-[card-in_600ms_var(--ease-out-expo)_both] gap-1.5 rounded-sm border bg-surface py-3 pr-3 pl-10 transition-[border-color,box-shadow,background-color] duration-300 ease-out-expo",
        active ? "border-route shadow-md" : "border-line",
        muted && "bg-transparent",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-3 left-3 grid size-[1.3rem] place-items-center rounded-full border-2 font-mono text-[0.625rem] font-bold tabular-nums transition-colors duration-300",
          active
            ? "border-route bg-route text-cta-ink"
            : muted
              ? "border-line-strong text-ink-muted"
              : "border-route text-green-ink",
        )}
      >
        {source.n}
      </span>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="type-mono link-route w-fit max-w-full truncate text-ink"
        title={`${t.entry.open}: ${source.url}`}
      >
        {domainOf(source.url)} ↗
      </a>
      {source.title && (
        <p className="line-clamp-2 text-[0.875rem] leading-snug text-ink">{source.title}</p>
      )}
      <p className="type-mono text-[0.75rem] text-ink-muted">
        <span className={official ? "text-accent" : "text-green-ink"}>
          {official ? t.entry.official : t.entry.curated}
        </span>
        {" · "}
        {official ? t.entry.readOn : t.entry.verifiedOn} {date(source.date)}
      </p>
      {source.pathway && source.pathway !== source.title && (
        <p className="text-[0.8125rem] text-ink-muted">{source.pathway}</p>
      )}
    </li>
  );
}
