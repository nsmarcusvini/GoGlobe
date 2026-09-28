# Checklist de lançamento (Fase 8)

Valores reais **nunca** entram no repositório nem no chat: cadastre-os direto na Vercel e nos painéis de cada serviço. "Secreta" = só servidor, nunca com prefixo `NEXT_PUBLIC_`.

## 1. Variáveis de ambiente na Vercel

Cadastre em _Project → Settings → Environment Variables_. Use valores diferentes para **Preview** e **Production** onde indicado.

| Variável                                       | Obrigatória        | Secreta | Onde obter / valor                                                                                                                      |
| ---------------------------------------------- | ------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                         | sim                | não     | Production: domínio final (ex.: `https://goglobe.com.br`). Preview: pode ficar sem (usa o padrão), mas links de login apontam para ele. |
| `NEXT_PUBLIC_SUPABASE_URL`                     | sim                | não     | Supabase → Project Settings → API → Project URL (`https://flwtpxqcpdwpbdjdiydb.supabase.co`)                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                | sim                | não     | Supabase → API → `anon` / publishable key                                                                                               |
| `SUPABASE_SERVICE_ROLE_KEY`                    | sim                | **sim** | Supabase → API → `service_role` / secret key                                                                                            |
| `PAYMENTS_ENABLED`                             | sim                | não     | `false` até o Stripe estar em modo live; então `true`                                                                                   |
| `STRIPE_SECRET_KEY`                            | com pagamentos     | **sim** | Stripe → Developers → API keys (`sk_live_…` em Production, `sk_test_…` em Preview)                                                      |
| `STRIPE_WEBHOOK_SECRET`                        | com pagamentos     | **sim** | Stripe → Webhooks → endpoint `https://SEU_DOMINIO/api/stripe/webhook` → Signing secret                                                  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`           | com pagamentos     | não     | Stripe → API keys (`pk_live_…` / `pk_test_…`)                                                                                           |
| `STRIPE_PRICE_PRO_MONTHLY`                     | com pagamentos     | não     | ID do Price recorrente mensal (`price_…`)                                                                                               |
| `STRIPE_PRICE_PRO_6MONTHS`                     | com pagamentos     | não     | ID do Price avulso de 6 meses (`price_…`)                                                                                               |
| `STRIPE_PIX_ENABLED`                           | não                | não     | `true` só depois de ativar Pix na conta Stripe                                                                                          |
| `PRO_PRICE_MONTHLY_BRL` / `PRO_PRICE_PASS_BRL` | não                | não     | Valores exibidos em `/precos` (padrão 29 e 129); devem bater com os Prices do Stripe                                                    |
| `AI_ENABLED`                                   | sim                | não     | `false` até rodar a ingestão no banco remoto e aprovar o relatório das 10 perguntas                                                     |
| `ANTHROPIC_API_KEY`                            | com IA             | **sim** | console.anthropic.com → API Keys                                                                                                        |
| `ANTHROPIC_MODEL`                              | não                | não     | Padrão `claude-opus-5-5`                                                                                                                |
| `AI_MONTHLY_MESSAGE_QUOTA`                     | não                | não     | Padrão 100 mensagens/mês por usuário Pro                                                                                                |
| `VOYAGE_API_KEY`                               | recomendada com IA | **sim** | dash.voyageai.com → API keys. A mesma chave deve ser usada ao rodar `npm run ingest` no banco remoto                                    |
| `VOYAGE_MODEL`                                 | não                | não     | Padrão `voyage-3.5`                                                                                                                     |
| `AI_MOCK`                                      | não                | não     | **Nunca** `true` em Production (é só para E2E)                                                                                          |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`              | não                | não     | `true` só depois de configurar o Google no Supabase (item 2)                                                                            |
| `NEXT_PUBLIC_POSTHOG_KEY`                      | não                | não     | Não usada: os eventos ficam na tabela própria `events`                                                                                  |

## 2. Supabase remoto (`flwtpxqcpdwpbdjdiydb`)

1. **Migrations e conteúdo:** aplicadas com confirmação do fundador (Fase 8). Depois: `npm run ingest` apontando para o remoto (com `VOYAGE_API_KEY`) se a IA for ligada.
2. **Auth → URL Configuration:** _Site URL_ = domínio de produção; _Redirect URLs_ = `https://SEU_DOMINIO/auth/callback**` e `https://*-SEU_TIME.vercel.app/auth/callback**` (previews).
3. **Auth → SMTP:** configure um SMTP próprio (Resend, Postmark, SES…). O envio padrão do Supabase tem limite baixo de e-mails por hora e não serve para produção.
4. **Auth → Email templates:** o link do magic link usa `{{ .ConfirmationURL }}`; confira o texto em pt-BR.
5. **Google OAuth (opcional):** Auth → Providers → Google com Client ID/Secret do Google Cloud; redirect `https://flwtpxqcpdwpbdjdiydb.supabase.co/auth/v1/callback`.
6. **Primeiro admin:** `npm run make-admin -- voce@exemplo.com` com as variáveis do remoto.

## 3. Stripe (quando `PAYMENTS_ENABLED=true`)

- Produtos/Prices em BRL: mensal recorrente e passe de 6 meses avulso.
- Webhook em `https://SEU_DOMINIO/api/stripe/webhook` com os eventos que o app trata: `checkout.session.completed`, `checkout.session.async_payment_succeeded` (Pix), `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`.
- Customer Portal ativado (cancelamento e troca de cartão).

## 4. Antes de abrir ao público

- [ ] Revisão jurídica: aviso legal, política de privacidade, termos de uso e modelo de produto (TODO do README).
- [ ] Razão social, CNPJ e e-mail do encarregado (LGPD) na política de privacidade.
- [ ] Revisão de copy pelo fundador (arquivos em `src/content/` marcados como rascunho).
- [ ] Logo oficial em SVG (hoje é raster).
- [ ] `npm run check-sources` sem links quebrados e sem conteúdo com mais de 90 dias.
- [ ] Domínio próprio na Vercel e `NEXT_PUBLIC_SITE_URL` atualizado.
