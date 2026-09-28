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

Na primeira vez que rodar o E2E: `npx playwright install chromium`.

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

- As migrations ficam em `supabase/migrations/`. Crie com `npx supabase migration new <nome>` e teste localmente com `npm run db:reset`.
- Depois de mudar o schema, rode `npm run db:types`.
- **Projeto remoto:** `flwtpxqcpdwpbdjdiydb`. Para vincular: `npx supabase link --project-ref flwtpxqcpdwpbdjdiydb`. Só aplique migrations no remoto (`npx supabase db push`) depois de testar localmente e com aprovação explícita.

## Deploy (Vercel)

1. Importe o repositório `nsmarcusvini/GoGlobe` na Vercel (framework Next.js detectado automaticamente).
2. Cadastre as variáveis do `.env.example` em _Settings → Environment Variables_, com valores distintos para Preview e Production. Chaves secretas **nunca** levam o prefixo `NEXT_PUBLIC_`.
3. No Supabase remoto, em _Authentication → URL Configuration_, defina o `Site URL` e adicione `https://<domínio>/auth/callback` às Redirect URLs.
4. Todo push gera um deploy de preview. A produção sai do branch `main`.

## Segurança

- A `SUPABASE_SERVICE_ROLE_KEY` só é usada em `src/lib/supabase/admin.ts`, que é protegido por `server-only`.
- RLS em 100% das tabelas (a partir da Fase 3).
- Os headers de segurança ficam em `next.config.ts`. A CSP com nonce entra quando as origens de terceiros estiverem definidas.
