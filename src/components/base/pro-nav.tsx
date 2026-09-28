"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { baseCopy } from "@/content/base";
import { cn } from "@/lib/cn";

/** Pro navigation: the app's own sections as stops on a short horizontal line. */
export function ProNav({ assistant }: { assistant: boolean }) {
  const pathname = usePathname();
  const t = baseCopy.nav;
  const items = [
    { href: "/app/base", label: t.base, match: ["/app/base"] },
    {
      href: "/app/painel",
      label: t.routes,
      match: ["/app/painel", "/app/planos", "/app/caminhos", "/app/resultados", "/app/comparar"],
    },
    ...(assistant
      ? [{ href: "/app/assistente", label: t.assistant, match: ["/app/assistente"] }]
      : []),
    { href: "/app/conta", label: t.account, match: ["/app/conta", "/app/onboarding"] },
  ];
  return (
    <nav aria-label={t.label} className="container-page">
      <ul className="relative flex gap-1 overflow-x-auto pb-px">
        {items.map((item) => {
          const current = item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2 px-3 text-[0.9375rem] transition-colors duration-300",
                  current ? "font-semibold text-ink" : "font-medium text-ink-muted hover:text-ink",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-full transition-colors duration-500",
                    current ? "bg-route" : "border border-line-strong",
                  )}
                />
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 bottom-0 h-0.5 origin-left bg-route transition-transform duration-500 ease-out-expo",
                    current ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
