"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Sticky section index drawn as route stops; the section in view is highlighted. */
export function DossierIndex({
  sections,
}: {
  sections: Array<{ id: string; label: string; count?: number }>;
}) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Nesta página">
      <ol className="relative grid">
        <span
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-[5px] w-px bg-line-strong"
        />
        {sections.map((s) => {
          const current = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "group flex items-center gap-3 py-2 transition-colors duration-300",
                  current ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative z-10 size-3 rounded-full border-2 transition-colors duration-500",
                    current
                      ? "border-route bg-route"
                      : "border-line-strong bg-bg group-hover:border-route",
                  )}
                />
                <span className={cn("text-[0.9375rem]", current && "font-semibold")}>
                  {s.label}
                </span>
                {s.count !== undefined && <span className="type-mono ml-auto">{s.count}</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
