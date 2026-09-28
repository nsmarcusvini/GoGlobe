import { landing } from "@/content/landing";
import { greatCircleKm } from "@/lib/geo";
import { cn } from "@/lib/cn";

const { hero, story } = landing;

const km = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/**
 * Chart legend for the hero: the origin plus the three destinations, each with
 * its capital's coordinates and the straight-line distance from Brasília.
 * Real data in the product's "stamp" voice (mono), not decoration.
 */
export function RouteLedger({ className }: { className?: string }) {
  const rows = [
    {
      code: hero.origin.code,
      capital: hero.origin.capital,
      coords: hero.origin.coords,
      distance: hero.origin.label,
      origin: true,
    },
    ...story.countries.map((country) => ({
      code: country.code,
      capital: country.capital,
      coords: country.coords,
      // Rounded to 10 km: capital-to-capital is already an approximation.
      distance: `≈ ${km.format(Math.round(greatCircleKm(hero.origin.position, country.position) / 10) * 10)} km`,
      origin: false,
    })),
  ];

  return (
    <div className={cn("rounded-md bg-bg/85 shadow-[inset_0_0_0_1px_var(--line)]", className)}>
      <table className="type-mono w-full border-separate border-spacing-0 text-left">
        <caption className="px-4 pt-4 pb-3 text-left sm:px-5">
          <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="font-semibold tracking-[0.14em] text-ink uppercase">
              {hero.ledger.caption}
            </span>
            <span className="text-ink-muted">{hero.ledger.note}</span>
          </span>
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">País</th>
            <th scope="col">Capital e coordenadas</th>
            <th scope="col">Distância de Brasília</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.code}>
              <th
                scope="row"
                className="relative w-0 border-t border-line py-3 pr-3 pl-4 align-top font-semibold whitespace-nowrap text-ink"
              >
                {/* Route line linking each waypoint to the next (1.4rem = dot centre). */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[1.375rem] w-px bg-route/45",
                    i === 0
                      ? "top-[1.4rem] bottom-0"
                      : i === rows.length - 1
                        ? "top-0 h-[1.4rem]"
                        : "inset-y-0",
                  )}
                />
                <span className="flex items-center gap-3">
                  <span aria-hidden="true" className="relative grid size-3 place-items-center">
                    {row.origin && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-route opacity-40" />
                    )}
                    <span
                      className={cn(
                        "relative size-3 rounded-full border-2 border-route",
                        row.origin ? "bg-route" : "bg-bg",
                      )}
                    />
                  </span>
                  {row.code}
                </span>
              </th>
              <td className="border-t border-line py-3 pr-3 align-top">
                <span className="text-ink">{row.capital}</span>
                {/* Coordinates: own line on phones, inline from sm; dropped under 360px. */}
                <span className="block whitespace-nowrap text-ink-muted max-[359px]:hidden sm:ml-3 sm:inline">
                  {row.coords}
                </span>
              </td>
              <td
                className={cn(
                  "border-t border-line py-3 pr-4 text-right align-top sm:pr-5",
                  row.origin ? "text-ink-muted" : "font-semibold whitespace-nowrap text-green-ink",
                )}
              >
                {row.distance}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
