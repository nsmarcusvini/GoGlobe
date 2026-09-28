import { ui } from "@/content/ui";
import { cn } from "@/lib/cn";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** Official source + last verification date. Shown next to every requirement. */
export function SourceBlock({
  url,
  verifiedAt,
  className,
}: {
  url: string;
  verifiedAt: Date | string;
  className?: string;
}) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const date = typeof verifiedAt === "string" ? new Date(verifiedAt) : verifiedAt;

  return (
    <p
      className={cn(
        "type-mono flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted",
        className,
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 shrink-0 text-accent">
        <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      </svg>
      <span>{ui.source.label}:</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-inline font-semibold text-accent"
      >
        {host}
        <span className="sr-only"> {ui.source.opensInNewTab}</span>
      </a>
      <span aria-hidden="true">·</span>
      <span>
        {ui.source.verifiedAt} <time dateTime={date.toISOString()}>{dateFormat.format(date)}</time>
      </span>
    </p>
  );
}
