import { RouteStory, type StoryChapter } from "@/components/map/route-story";
import { ButtonLink } from "@/components/ui/button";
import { landing } from "@/content/landing";

const { story } = landing;

function ChapterHead({
  index,
  coords,
  eyebrow,
}: {
  index: string;
  coords: string;
  eyebrow: string;
}) {
  return (
    <div className="type-mono flex items-center gap-3 text-ink-muted">
      <span className="font-semibold text-green-ink">{index}</span>
      <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
      <span className="tracking-[0.14em] text-accent uppercase">{eyebrow}</span>
      <span className="ml-auto hidden sm:inline">{coords}</span>
    </div>
  );
}

export function Story() {
  const chapters: StoryChapter[] = [
    {
      hud: `${story.intro.coords} · Brasília`,
      content: (
        <div className="grid gap-5">
          <ChapterHead
            index={story.intro.index}
            coords={story.intro.coords}
            eyebrow={story.intro.eyebrow}
          />
          <h2 className="type-display">{story.intro.title}</h2>
          <p className="text-ink-muted">{story.intro.body}</p>
        </div>
      ),
    },
    ...story.countries.map((country) => ({
      hud: `${country.coords} · ${country.capital}`,
      content: (
        <div className="grid gap-5">
          <ChapterHead index={country.index} coords={country.coords} eyebrow={country.code} />
          <h2 className="type-display">{country.name}</h2>
          <p className="text-ink-muted">{country.body}</p>
          <dl className="grid gap-3 border-t border-line pt-5">
            <div className="grid gap-1">
              <dt className="type-mono text-ink-muted">Órgão oficial</dt>
              <dd>
                <a
                  href={country.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-inline font-semibold text-accent"
                >
                  {country.authority}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="type-mono text-ink-muted">Profissional licenciado</dt>
              <dd className="text-[0.9375rem]">{country.professional}</dd>
            </div>
          </dl>
        </div>
      ),
    })),
    {
      hud: "3 países · 1 perfil",
      content: (
        <div className="grid gap-6">
          <ChapterHead index="05" coords="—" eyebrow="Chegada" />
          <h2 className="type-display">Três países. Um perfil só.</h2>
          <p className="text-ink-muted">
            Seus resultados mostram os caminhos organizados por país, cada um com o status de cada
            requisito. É um critério de organização, não uma recomendação.
          </p>
          <div>
            <ButtonLink href="/app/onboarding" size="lg" arrow>
              Criar meu perfil grátis
            </ButtonLink>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="paises" aria-label="Países cobertos" className="border-b border-line">
      <RouteStory chapters={chapters} />
    </section>
  );
}
