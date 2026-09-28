# GoGlobe

Plataforma de planejamento migratório para brasileiros (Austrália, Nova Zelândia e Canadá). Organiza informações públicas de sites oficiais e mostra quais caminhos têm requisitos compatíveis com o perfil informado. **Não presta aconselhamento migratório** (veja `/aviso-legal`).

Especificação completa do MVP: [`PROMPT_MVP_planejamento_migratorio.md.md`](PROMPT_MVP_planejamento_migratorio.md.md).

> **TODO:** Revisar textos legais e o modelo de produto com advogado antes do lançamento público.

## Stack

- **Next.js 16** (App Router, TypeScript `strict`, Server Components e Server Actions) na **Vercel**
- **Supabase**: Postgres, Auth, RLS, Storage e pgvector, com `@supabase/ssr`
- **Tailwind CSS v4**, com tokens de design definidos na Fase 2
- **Zod** para validação, **Vitest** para testes unitários e **Playwright** para E2E
- **ESLint + Prettier**, com CI no GitHub Actions

## Pré-requisitos

- Node.js 22+ (desenvolvido com Node 24)
- Docker Desktop rodando (necessário para o Supabase local)
- A CLI do Supabase já vem como dependência de desenvolvimento (`npx supabase ...`). Não precisa instalar globalmente.

## Setup local

```bash
npm install
cp .env.example .env.local
npm run db:start
```

`npm run db:start` imprime a `API URL`, a chave `anon`/publishable e a `service_role`/secret do ambiente local. Copie esses valores para `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`. Para ver de novo: `npx supabase status`.

```bash
npm run dev
```

O app roda em http://localhost:3000, e o Supabase Studio local em http://localhost:54323.

> O app sobe mesmo sem as variáveis do Supabase (o proxy de sessão fica inativo). Isso permite rodar o build e o E2E no CI sem banco.

## Scripts

| Script                  | O que faz                                                  |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                                |
| `npm run build`         | Build de produção                                          |
| `npm run lint`          | ESLint                                                     |
| `npm run format`        | Prettier (escreve); `format:check` só verifica             |
| `npm run typecheck`     | Gera os tipos de rota do Next e roda `tsc --noEmit`        |
| `npm test`              | Testes unitários (Vitest); `test:watch` em modo observação |
| `npm run test:e2e`      | Testes E2E (Playwright, desktop e mobile)                  |
| `npm run check`         | Lint + typecheck + formatação + unitários                  |
| `npm run db:start/stop` | Sobe/derruba o Supabase local                              |
| `npm run db:reset`      | Recria o banco **local** aplicando migrations e `seed.sql` |
| `npm run db:types`      | Gera `src/lib/database.types.ts` a partir do banco local   |
| `npm run db:test`       | Testes pgTAP de RLS e schema (`supabase/tests/`)           |
| `npm run check-sources` | Links das fontes, conteúdo com +90 dias e regras inválidas |
| `npm run make-admin`    | Dá papel de admin a um e-mail (`-- pessoa@exemplo.com`)    |

Na primeira vez que rodar o E2E: `npx playwright install chromium`.

## Design: direção "Rota Traçada"

Criado com a skill `/sites-incriveis` (Fase 2). A página inicial é uma carta de navegação clara, sobre a qual uma rota se desenha do Brasil até cada país. Os tokens (cores da marca, tipografia, espaços, easing, sombras, tema claro e escuro) ficam em `src/app/globals.css`, com as decisões de direção de arte comentadas no topo.

- **Fontes:** Bricolage Grotesque (display e corpo) + JetBrains Mono (coordenadas, códigos, datas de verificação), servidas localmente por `next/font`.
- **Componentes-base:** `src/components/ui/` (botão, campo, status de requisito, progresso em rota, bloco de fonte oficial, card de caminho) e `<LegalNotice />`.
- **Vitrine:** `/design` (não indexada) mostra todos os componentes nos dois temas.
- **Mapa:** gerado a partir do Natural Earth (domínio público) por `npm run map:build`. Terra e grade viram SVGs estáticos em `public/map/`; países e cidades ficam em `src/components/map/world-map-data.ts`.
- **Logo:** `npm run brand:logo` recorta `brand/logo-original.png` e gera a versão transparente e os ícones. **Pendente:** logo oficial em SVG.
- **Movimento:** `prefers-reduced-motion` desliga reveals, desenho de rota e câmera.
- **Textos:** centralizados em `src/content/` e marcados como rascunho até a revisão do fundador.

## App do usuário (Fase 5, direção "Carta de Bordo")

Criado com a skill `/sites-incriveis`, herdando a Rota Traçada. O app é a própria rota: um trilho de jornada (Perfil → Resultados → Painel → Conta), mapas com as rotas da pessoa e requisitos exibidos como pontos numa linha.

- **Entrar:** `/entrar` com link mágico (a conta é criada no primeiro acesso). O Google aparece quando `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true` e o provedor estiver configurado no Supabase (Authentication → Providers → Google, com a URL de callback `/auth/callback`).
- **Proteção:** o `proxy` redireciona `/app/*` sem sessão para `/entrar?next=…`; cada página e Server Action confere o usuário de novo, e o RLS é a barreira final.
- **Onboarding** (`/app/onboarding`): uma pergunta por tela, 11 perguntas em 5 trechos, cada resposta validada (Zod) e salva na hora.
- **Resultados** (`/app/resultados`): motor de elegibilidade da Fase 4 sobre o perfil; ordenação por país e eliminatórios não atendidos, com o aviso de que não é recomendação.
- **Caminho** (`/app/caminhos/[slug]`): dossiê com o status de cada requisito para o perfil e o botão "Acompanhar".
- **Checklist** (`/app/planos/[id]`): etapas e documentos do caminho como rota vertical, com notas por item e situação do plano. Mostra aviso quando o caminho mudou de versão.
- **Painel** (`/app/painel`) e **Conta** (`/app/conta`): exportar dados (JSON) e excluir conta (LGPD).
- **Páginas públicas com SEO:** `/paises/[pais]` e `/caminhos/[pais]/[slug]` geradas do banco com ISR (1 h), metadata, canonical, Open Graph, JSON-LD de breadcrumb, `sitemap.xml` e `robots.txt`.
- **E2E da jornada completa** (`e2e/app-flow.spec.ts`): cadastro → onboarding → resultados → acompanhar → marcar item → exportar → excluir. Roda localmente com o Supabase no ar e no CI num job próprio.

## Monetização e analytics (Fase 6, direção "Livro de Bordo")

- **Planos** (`/precos`): Gratuito e Pro (R$ 29/mês ou R$ 129 pelo passe de 6 meses; valores exibidos vêm de `PRO_PRICE_MONTHLY_BRL` / `PRO_PRICE_PASS_BRL`).
- **Limites no banco:** o plano gratuito acompanha 1 caminho (gatilho `enforce_free_plan_limit`); prazos no checklist são só do Pro (`enforce_pro_fields`). `is_pro()` considera assinatura ativa ou passe dentro da validade. Provado por `supabase/tests/database/monetization.test.sql`.
- **Recursos Pro:** comparador (`/app/comparar`, até 3 caminhos com rotas sobrepostas), simulador de custos em livro-caixa com linhas próprias, prazos por item e alertas de mudança (a partir de `content_changes`, via `pathway_changes_since`).
- **`PAYMENTS_ENABLED=false` (padrão):** "Assinar" abre o painel da lista de espera (fake door), grava em `waitlist` e registra `pro_interest`.
- **`PAYMENTS_ENABLED=true`:** Stripe Checkout (mensal = assinatura; passe = pagamento único, com Pix se `STRIPE_PIX_ENABLED=true`), portal do cliente em Conta e webhook em `/api/stripe/webhook` (assinatura verificada, idempotente por `stripe_events`, único escritor de `subscriptions`).

### Ativar o Stripe

1. Crie dois produtos/preços em BRL: mensal recorrente (R$ 29) e pagamento único (R$ 129). Copie os IDs para `STRIPE_PRICE_PRO_MONTHLY` e `STRIPE_PRICE_PRO_6MONTHS`.
2. Webhook apontando para `https://<domínio>/api/stripe/webhook` com os eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`. Copie o segredo para `STRIPE_WEBHOOK_SECRET`.
3. Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI) e cartão de teste `4242 4242 4242 4242`.
4. Pix: habilite na conta Stripe e defina `STRIPE_PIX_ENABLED=true` (vale só para o passe; assinaturas mensais usam cartão).
5. Ligue `PAYMENTS_ENABLED=true`.

### Analytics e LGPD

- Eventos próprios na tabela `events` (sem terceiros), gravados no servidor **só com consentimento** (cookie `gg_consent`). Vercel Analytics também só carrega após o aceite.
- Cartão de consentimento com "Aceitar" e "Recusar" de mesmo peso; "Preferências de cookies" no rodapé reabre a escolha.
- `/admin/metricas`: funil (pessoas distintas por etapa) e retenção semanal por coorte.
- Rate limit em Postgres (`hit_rate_limit`) na lista de espera, checkout e `/api/events`.
- `/privacidade`: rascunho da política, **pendente de revisão jurídica**; razão social/CNPJ e e-mail do encarregado aparecem marcados como pendentes.

## Estrutura

```
src/
  app/
    (marketing)/        # home, páginas públicas de SEO, preços, legal
    (auth)/             # entrar, callback
    (app)/app/          # área logada
    admin/              # curadoria de conteúdo (restrito)
    api/stripe/webhook/
  components/
  content/              # textos (pt-BR) centralizados, incluindo o aviso legal
  lib/
    supabase/           # clients: browser, server, admin (service role) e proxy de sessão
    eligibility/        # motor de regras (puro, testável)
    stripe/
    analytics/
    env.ts              # variáveis de ambiente validadas com Zod
  proxy.ts              # (antigo middleware) renova a sessão do Supabase
supabase/
  config.toml
  migrations/
  seed.sql
e2e/                    # testes Playwright
```

## Banco de dados

- **Migrations** em `supabase/migrations/`. Crie com `npx supabase migration new <nome>` e teste com `npm run db:reset` (recria o banco **local** com migrations e `seed.sql`).
- Depois de mudar o schema: `npm run db:types` e `npm run db:test`.
- **Conteúdo × usuário:** tabelas de conteúdo (`countries`, `pathways`, `requirements`, `pathway_steps`, `documents`, `cost_items`, `occupations`, `exchange_rates`) têm leitura pública só do que está publicado e escrita só para admin. Tabelas de usuário (`profiles`, `user_plans`, `checklist_items`, `subscriptions`, `ai_usage`) só são acessíveis pelo dono. `subscriptions`, `ai_usage` e `waitlist` só são escritas pelo servidor (service role).
- **RLS provada por testes:** `supabase/tests/database/rls.test.sql` (36 asserções) roda no CI a cada push.
- **Log e versões:** toda edição de conteúdo vai para `content_changes` (quem, quando, campos, antes/depois). Mudança substantiva num caminho publicado incrementa `pathways.version`; só reverificar não incrementa. Isso alimenta os alertas do plano Pro.
- **Projeto remoto:** `flwtpxqcpdwpbdjdiydb`. Para vincular: `npx supabase login` e `npx supabase link --project-ref flwtpxqcpdwpbdjdiydb`. Só aplique migrations no remoto (`npx supabase db push`) depois de testar localmente e **com aprovação explícita**.

## Curadoria de conteúdo (admin)

1. Dê papel de admin a um e-mail: `npm run make-admin -- voce@exemplo.com` (usa a service role do `.env.local`; no ambiente local o e-mail chega no Mailpit, em http://127.0.0.1:54324).
2. Entre em `/admin/entrar` e abra o link recebido. `/admin` lista os caminhos por país, com status, versão e data de verificação.
3. No editor de cada caminho:
   - edite os dados e os itens (requisitos, etapas, documentos, custos). **Toda informação precisa da URL oficial de onde saiu.**
   - A regra de cada requisito é um JSON validado ao vivo pelo mesmo schema do servidor (`src/lib/eligibility/rules.ts`); há exemplos de cada operador no próprio editor.
   - Depois de conferir a página oficial, use **"Marcar como verificado hoje"**.
   - Publique só o que foi verificado (o banco impede publicar sem data de verificação). O que não der para confirmar fica como **rascunho**, com o motivo no campo interno.
4. Rode `npm run check-sources` periodicamente: aponta links quebrados, itens verificados há mais de 90 dias e regras inválidas (sai com código 1 se houver problema). Alguns sites do governo bloqueiam acesso automatizado; esses aparecem como AVISO para conferir no navegador.

### Conteúdo inicial

O seed tem 16 caminhos verificados nos sites oficiais em 28/09/2026: Austrália (189, 190, 491, 482 Core Skills, 500, 462), Nova Zelândia (Skilled Migrant, AEWV, estudante, Working Holiday Brasil) e Canadá (FSW, CEC, FST, PNP, study permit, PGWP). Pendências conhecidas:

- **Custos típicos** (não governamentais) não foram cadastrados: não há fonte oficial para verificá-los.
- **Cotação do NZD:** a PTAX do Banco Central não inclui NZD. AUD e CAD usam a PTAX de 25/09/2026.
- **Listas de ocupações** não foram importadas; os requisitos de ocupação são de verificação manual, com link para a lista oficial.

## Deploy (Vercel)

1. Importe o repositório `nsmarcusvini/GoGlobe` na Vercel (framework Next.js detectado automaticamente).
2. Cadastre as variáveis do `.env.example` em _Settings → Environment Variables_, com valores distintos para Preview e Production. Chaves secretas **nunca** levam o prefixo `NEXT_PUBLIC_`.
3. No Supabase remoto, em _Authentication → URL Configuration_, defina o `Site URL` e adicione `https://<domínio>/auth/callback` às Redirect URLs.
4. Todo push gera um deploy de preview. A produção sai do branch `main`.

## Segurança

- A `SUPABASE_SERVICE_ROLE_KEY` só é usada em `src/lib/supabase/admin.ts`, que é protegido por `server-only`.
- RLS em 100% das tabelas (a partir da Fase 3).
- Os headers de segurança ficam em `next.config.ts`. A CSP com nonce entra quando as origens de terceiros estiverem definidas.
