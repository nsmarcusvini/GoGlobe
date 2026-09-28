"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { routeBreak as t } from "@/content/pages";

/* Rastreio, error state: the route runs solid, turns dashed, breaks at an
   amber marker and continues faded on the other side. Two ways out: try the
   same stretch again, or go back to the last safe point. No technical codes. */

export function RouteBreak({ onRetry, title = t.title }: { onRetry: () => void; title?: string }) {
  const pathname = usePathname() ?? "/";
  const inApp = pathname.startsWith("/app") || pathname.startsWith("/admin");
  const safe = inApp ? { href: "/app", label: t.safeApp } : { href: "/", label: t.safeSite };

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-bg text-ink">
      <header className="container-page flex h-16 items-center border-b border-line">
        <Logo />
      </header>
      <main
        id="conteudo"
        className="container-page grid content-center gap-14 py-(--space-section) lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-24"
      >
        <div className="grid justify-items-start gap-8">
          <p className="type-mono flex items-center gap-3 text-(--status-info)">
            <span aria-hidden="true" className="size-3 rounded-full border-2 border-current" />
            {t.coords}
          </p>
          <h1 className="type-display max-w-[14ch]">{title}</h1>
          <p className="type-lead">{t.body}</p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-12 items-center gap-3 rounded-sm bg-cta px-6 font-semibold text-cta-ink shadow-sm transition-[background-color,box-shadow] duration-300 ease-out-expo hover:bg-cta-hover hover:shadow-md"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
                <path
                  d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
              {t.retry}
            </button>
            {/* A full navigation (not a client transition) resets whatever broke. */}
            <a href={safe.href} className="link-route font-semibold">
              {safe.label} →
            </a>
          </div>
        </div>

        <svg
          viewBox="0 0 420 220"
          aria-hidden="true"
          className="w-full max-w-lg justify-self-center"
        >
          <path
            d="M20 170 C90 170 110 110 170 100"
            fill="none"
            stroke="var(--route)"
            strokeWidth="3"
            strokeLinecap="round"
            className="journey-route"
            pathLength={1}
            strokeDasharray="1"
          />
          <path
            d="M170 100 C190 96 205 92 222 90"
            fill="none"
            stroke="var(--route)"
            strokeWidth="3"
            strokeDasharray="6 7"
            strokeLinecap="round"
          />
          <circle cx="20" cy="170" r="7" fill="var(--route)" />
          <g transform="translate(252 86)">
            <circle
              r="17"
              fill="var(--status-info-bg)"
              stroke="var(--status-info)"
              strokeWidth="2.5"
            />
            <path
              d="M-6 -6 L6 6 M6 -6 L-6 6"
              stroke="var(--status-info)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M284 80 C330 70 350 50 400 40"
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="3"
            strokeDasharray="4 9"
            strokeLinecap="round"
          />
          <circle
            cx="400"
            cy="40"
            r="6"
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="2.5"
          />
        </svg>
      </main>
    </div>
  );
}
