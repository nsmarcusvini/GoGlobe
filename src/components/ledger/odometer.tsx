"use client";

import { cn } from "@/lib/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A number whose digits roll to their value (Livro de Bordo). Non-digit
 * characters (R$, dots, commas) render as-is. Screen readers get the plain text.
 */
export function Odometer({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("tabular inline-flex items-baseline", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {[...value].map((char, i) => {
          const index = DIGITS.indexOf(char);
          if (index === -1) {
            return (
              <span key={`${i}-${char}`} className="inline-block whitespace-pre">
                {char}
              </span>
            );
          }
          return (
            <span key={`d-${value.length - i}`} className="odometer-digit">
              <span style={{ transform: `translateY(-${index * 10}%)` }}>
                {DIGITS.map((d) => (
                  <span key={d} className="block h-[1em]">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

export const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
