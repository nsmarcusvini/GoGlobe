# Prompt para o Claude Code: MVP da plataforma de planejamento migratório

> Salve este arquivo na raiz do repositório e peça ao Claude Code: "Leia `PROMPT_MVP_planejamento_migratorio.md` e siga o plano, fase por fase."
> Onde aparecer `[NOME DO PRODUTO]`, use o nome definido na entrevista da Fase 1 (ou um nome provisório até lá).

---

## 0. Seu papel e como trabalhar

Você é o engenheiro principal deste projeto. Vai construir, do zero, o MVP de um SaaS B2C de planejamento migratório para brasileiros, começando por Austrália, Nova Zelândia e Canadá.

Regras de trabalho, válidas para todo o projeto:

1. **Trabalhe em fases.** Ao final de cada fase, pare, mostre um resumo curto do que foi feito, o que ficou pendente e o que vem a seguir, e **espere minha aprovação** antes de começar a próxima.
2. **Planeje antes de codar.** No início de cada fase, apresente o plano da fase (arquivos, tabelas, decisões) em poucas linhas.
3. **Nunca invente dados migratórios.** Requisitos, custos, prazos e nomes de vistos só entram no banco com URL de fonte oficial e data de verificação. Se não conseguir verificar algo, registre como rascunho (não publicado) e liste para mim.
4. **Commits pequenos e descritivos** (Conventional Commits), um por unidade lógica de trabalho.
5. **Pergunte quando houver ambiguidade real.** Não pergunte o que já está respondido neste documento.
6. **Não rode comandos destrutivos** (reset de banco remoto, `drop`, deploy em produção) sem minha confirmação explícita.
7. **Idioma:** interface, conteúdo e mensagens de erro em português do Brasil. Código, nomes de tabelas e commits em inglês.

---

## 1. Contexto do produto

**Problema:** milhões de brasileiros querem morar no exterior, mas a informação oficial sobre vistos está espalhada, em inglês e muda com frequência. Consultorias são caras para quem ainda está só explorando.

**Proposta:** o usuário cria um perfil (idade, profissão, formação, experiência, nível de inglês, estado civil, orçamento e objetivo: trabalho, estudo ou residência) e a plataforma mostra quais caminhos migratórios têm requisitos compatíveis com o que ele informou, com requisitos, documentos, custos, etapas e um checklist pessoal para acompanhar o progresso.

**Público:** brasileiros de 20 a 45 anos, maioria com ensino superior, que estão na fase de pesquisa e planejamento. Acessam muito pelo celular.

**Modelo:** freemium. Gratuito para atrair; plano pago com recursos avançados; IA no plano pago (em fase posterior, atrás de feature flag).

**Objetivo do MVP:** validar demanda organicamente (SEO em português + comunidades). Priorize velocidade de lançamento e medição, não completude.

---

## 2. Restrição regulatória (leia antes de tudo, afeta o produto inteiro)

Os três países regulam quem pode dar **aconselhamento migratório**. A Nova Zelândia é a mais explícita: a lei de licenciamento (Immigration Advisers Licensing Act 2007) vale também para quem está fora do país, pago ou não. O governo neozelandês considera aconselhamento, por exemplo, dizer a alguém qual visto é melhor para ele, quais documentos precisa ou quais caminhos tem para trabalho ou residência. Por outro lado, repassar informação pública (como os critérios de elegibilidade publicados no site oficial) não é aconselhamento. Canadá e Austrália têm regras equivalentes (consultores RCIC e agentes registrados, respectivamente).

Portanto, o produto é uma **ferramenta de informação e autoavaliação**, nunca de recomendação. Implemente estas regras:

- **Nada de "recomendado para você", "melhor opção", "você deve aplicar para".** Use linguagem como "caminhos com requisitos compatíveis com o que você informou" e "requisitos que você informou atender".
- **Todo requisito exibido mostra a fonte oficial** (link) e a data da última verificação.
- **Aviso legal visível** no onboarding, na tela de resultados e no rodapé: a plataforma organiza informações públicas, não presta aconselhamento migratório, e decisões devem ser confirmadas com as fontes oficiais ou com um profissional licenciado (RMA na Austrália, LIA na Nova Zelândia, RCIC ou advogado no Canadá).
- Crie uma página `/aviso-legal` com esse texto completo e um bloco reutilizável `<LegalNotice />`.
- A IA (Fase 7) segue as mesmas regras (detalhes lá).
- Deixe um TODO no README: "Revisar textos legais e o modelo de produto com advogado antes do lançamento público."

---

## 3. Stack obrigatória

Hospedagem: **Vercel** (app) + **Supabase** (banco, auth, storage, vetores).

- **Next.js** na versão estável mais recente, App Router, TypeScript em modo `strict`, Server Components e Server Actions por padrão.
- **Supabase:** Postgres, Auth (e-mail com magic link + Google OAuth), Row Level Security em todas as tabelas, Storage (reservado para fases futuras), extensão `pgvector` (Fase 7). Use `@supabase/ssr` para sessão no Next.js.
- **Supabase CLI** para migrations versionadas em `supabase/migrations/` e seed em `supabase/seed.sql`. Rode tudo localmente com `supabase start` antes de aplicar no projeto remoto.
- **Tipos do banco** gerados com `supabase gen types typescript` em `src/lib/database.types.ts`.
- **Estilo:** Tailwind CSS com tokens de design em CSS variables (definidos na Fase 2 pela skill `/sites-incriveis`). Pode usar primitivas acessíveis (Radix / shadcn/ui) para componentes do app, **sempre reestilizadas com os tokens do projeto**, nunca com o visual padrão.
- **Validação:** Zod em todas as entradas (formulários, Server Actions, webhooks).
- **Pagamentos:** Stripe Billing (Checkout + Customer Portal + webhooks). Verifique se a conta suporta BRL e Pix; se não suportar Pix, siga com cartão e registre a pendência.
- **IA (Fase 7):** Vercel AI SDK + API da Anthropic, modelo configurável por `ANTHROPIC_MODEL`.
- **Analytics:** Vercel Analytics + eventos de produto (PostHog ou tabela própria `events`, escolha a mais simples e justifique).
- **Testes:** Vitest (unitários, especialmente o motor de elegibilidade) e Playwright (fluxos principais).
- **Qualidade:** ESLint, Prettier, `tsc --noEmit` e testes rodando em GitHub Actions a cada push.

Estrutura sugerida:

```
src/
  app/
    (marketing)/        # home, páginas públicas de SEO, preços, legal
    (auth)/             # entrar, callback
    (app)/app/          # área logada
    admin/              # curadoria de conteúdo (restrito)
    api/stripe/webhook/
  components/
  lib/
    supabase/           # clients server/browser/admin
    eligibility/        # motor de regras (puro, testável)
    stripe/
    analytics/
  content/              # textos estáticos e aviso legal
supabase/
  migrations/
  seed.sql
```

---

## 4. Escopo do MVP

**Dentro:**

- Landing page, páginas públicas por país e por caminho (SEO), página de preços, páginas legais.
- Cadastro/login.
- Onboarding em etapas para criar o perfil.
- Resultados: caminhos compatíveis, com status por requisito.
- Página de detalhe do caminho: requisitos, documentos, custos estimados (moeda original + conversão aproximada em BRL com data da cotação), etapas, fontes.
- "Acompanhar caminho": cria um plano com checklist pessoal (itens gerados a partir das etapas e documentos do caminho), marcar concluído, notas por item.
- Painel com os planos acompanhados e progresso.
- Freemium com limites aplicados no servidor + Stripe.
- Área admin mínima para curar conteúdo.
- Analytics de funil.
- LGPD: consentimento de cookies não essenciais, exportar e excluir conta.

**Fora (não construir agora):** upload de documentos, marketplace de profissionais, notificações por e-mail além do transacional, app mobile, outros países, multilíngue (mas centralize strings para facilitar i18n depois).

---

## 5. Modelo de dados

Crie via migrations. Todas as tabelas com `id uuid default gen_random_uuid()`, `created_at` e `updated_at` (trigger). Ajuste nomes se tiver motivo técnico, mas mantenha a separação **conteúdo × dados do usuário**.

**Conteúdo (leitura pública, escrita só admin):**

- `countries`: `code` (AU, NZ, CA), `name_pt`, `currency`, `official_site_url`, `is_active`.
- `pathways`: `country_id`, `slug`, `official_name`, `name_pt`, `category` (work | study | residence | working_holiday), `summary_pt`, `typical_duration_text`, `leads_to_residence` (bool), `status` (draft | published | archived), `last_verified_at`, `version`.
- `requirements`: `pathway_id`, `key`, `label_pt`, `description_pt`, `rule` (jsonb, ver seção 6), `is_hard` (eliminatório ou não), `source_url`, `last_verified_at`, `sort_order`.
- `pathway_steps`: `pathway_id`, `order`, `title_pt`, `description_pt`, `estimated_duration_text`, `source_url`.
- `documents`: `pathway_id`, `name_pt`, `description_pt`, `needs_translation` (bool), `needs_apostille` (bool), `source_url`.
- `cost_items`: `pathway_id`, `label_pt`, `amount_min`, `amount_max`, `currency`, `is_mandatory`, `source_url`, `last_verified_at`.
- `occupations` (opcional no MVP, pode ser texto livre + lista simples por país): `country_id`, `code`, `name_en`, `name_pt`, `list_name`.
- `content_changes`: log de alterações de conteúdo (quem, quando, campo, antes/depois). Base para os alertas de mudança do plano pago.
- `exchange_rates`: `currency`, `brl_rate`, `fetched_at` (atualização manual ou job diário simples).

**Usuário (RLS: cada usuário só lê e escreve o que é dele):**

- `profiles`: `user_id` (FK auth.users, único), `birth_date`, `occupation_text`, `occupation_id` (nullable), `education_level`, `years_experience`, `english_level` (none | basic | intermediate | advanced | fluent), `english_test` (nullable: IELTS, PTE, TOEFL, CELPIP, Duolingo) e `english_score`, `marital_status`, `has_children`, `budget_brl`, `goal` (work | study | residence), `target_countries` (array), `role` (user | admin), `onboarding_completed_at`.
- `user_plans`: `user_id`, `pathway_id`, `pathway_version`, `status` (exploring | preparing | applied | paused | done), `notes`.
- `checklist_items`: `user_plan_id`, `source_type` (step | document | custom), `source_id`, `title`, `is_done`, `done_at`, `due_date`, `notes`, `sort_order`.
- `subscriptions`: `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `plan` (free | pro), `status`, `current_period_end`. Escrita **somente** via webhook com service role.
- `ai_usage` (Fase 7): `user_id`, `period_start`, `messages_used`.
- `waitlist`: `email`, `source`, `created_at` (para fake door, ver seção 8).

Políticas RLS: conteúdo `published` legível por `anon` e `authenticated`; escrita de conteúdo só para `profiles.role = 'admin'`; tabelas de usuário restritas a `auth.uid()`. Escreva testes SQL ou de integração que provem que um usuário não lê dados de outro.

---

## 6. Motor de elegibilidade (coração do produto)

Implemente em `src/lib/eligibility/` como **funções puras em TypeScript**, sem IA e sem acesso ao banco dentro da lógica, para ser auditável e testável.

- Cada `requirements.rule` é um JSON validado por schema Zod. Operadores mínimos: `age_max`, `age_min`, `english_min` (por nível ou por nota de teste), `education_min`, `experience_min_years`, `budget_min_brl`, `occupation_in_list`, `goal_in`, `manual` (requisito que não dá para avaliar automaticamente, ex.: oferta de emprego, antecedentes criminais).
- Para cada requisito, o motor devolve: `meets`, `does_not_meet`, `insufficient_info` ou `manual_check`.
- Para cada caminho, um resumo: quantos requisitos atendidos, quais eliminatórios não atendidos, quais precisam de verificação manual.
- **Não existe pontuação de "melhor caminho" nem ordenação por recomendação.** Ordene por país e depois por quantidade de requisitos eliminatórios não atendidos (menos primeiro), deixando claro na interface que isso é um critério de organização, não uma recomendação.
- Para sistemas de pontos (ex.: Express Entry, points test australiano), no MVP exiba os critérios e um link para a calculadora oficial; não reimplemente a pontuação oficial.
- Cobertura de testes alta: casos de fronteira de idade, inglês, perfil incompleto, regra inválida.

---

## 7. Conteúdo inicial (seed)

Monte o seed com 12 a 15 caminhos. A lista abaixo é **candidata**: verifique cada item no site oficial antes de inserir (programas são renomeados, fechados ou alterados com frequência), ajuste o que mudou e me mostre o que não conseguiu confirmar.

- **Austrália** (homeaffairs.gov.au / immi.homeaffairs.gov.au): Skilled Independent (189), Skilled Nominated (190), Skilled Work Regional (491), visto de trabalho patrocinado pelo empregador (482, hoje Skills in Demand), Student (500), Work and Holiday (462), se houver acordo vigente com o Brasil.
- **Nova Zelândia** (immigration.govt.nz): Skilled Migrant Category Resident Visa, Accredited Employer Work Visa, Student Visa, Working Holiday Visa para brasileiros.
- **Canadá** (canada.ca/ircc): Express Entry (Federal Skilled Worker, Canadian Experience Class, Federal Skilled Trades), Provincial Nominee Program (visão geral), Study Permit, Post-Graduation Work Permit (como etapa pós-estudo).

Para cada caminho: resumo em português claro, requisitos com `rule`, etapas, documentos (sinalize tradução juramentada e apostilamento quando aplicável para brasileiros), custos oficiais (taxas de governo) e custos típicos separados e rotulados como estimativa, fontes e `last_verified_at`. Itens não verificados entram como `draft`.

Crie também um script `scripts/check-sources.ts` que verifica se as `source_url` ainda respondem (status HTTP) e lista conteúdos com `last_verified_at` acima de 90 dias.

---

## 8. Freemium e pagamentos

| Recurso | Gratuito | Pro |
|---|---|---|
| Perfil e resultados de compatibilidade | Sim | Sim |
| Detalhe de caminho com requisitos e fontes | Sim | Sim |
| Caminhos acompanhados com checklist | 1 | Ilimitado |
| Comparador lado a lado (até 3 caminhos) | Não | Sim |
| Simulador de custos em BRL | Resumo | Completo, editável |
| Prazos e lembretes no checklist | Não | Sim |
| Alertas quando um caminho acompanhado mudar | Não | Sim |
| Assistente de IA (Fase 7) | Não | Sim, com cota mensal |

- Ofertas a testar: **assinatura mensal** e **passe de 6 meses** (pagamento único). Crie ambos no Stripe; valores ficam em variáveis de ambiente/config para eu ajustar.
- Limites aplicados **no servidor** (Server Actions e RLS quando fizer sentido), nunca só na interface.
- Webhook do Stripe idempotente, com verificação de assinatura, atualizando `subscriptions`.
- **Feature flag `PAYMENTS_ENABLED`:** quando `false`, o botão de assinar abre uma tela de lista de espera (fake door) que grava em `waitlist` e dispara o evento `pro_interest`. Assim consigo validar intenção de compra antes de ativar o Stripe.

---

## 9. Páginas e rotas

**Públicas (marketing/SEO):**

- `/`: landing.
- `/paises/[pais]`: visão geral do país e lista de caminhos.
- `/caminhos/[pais]/[slug]`: página pública do caminho (requisitos, custos, etapas, fontes, CTA para criar perfil). Gerada estaticamente a partir do banco com revalidação (ISR).
- `/precos`, `/sobre`, `/aviso-legal`, `/termos`, `/privacidade`.

**Autenticação:** `/entrar`, `/auth/callback`.

**App (logado):**

- `/app/onboarding`: perfil em 4 a 5 etapas curtas, com barra de progresso, salvando a cada etapa.
- `/app/resultados`: caminhos compatíveis com status por requisito.
- `/app/caminhos/[slug]`: detalhe personalizado (cada requisito marcado com o status do usuário).
- `/app/planos/[id]`: checklist do caminho acompanhado.
- `/app/comparar`: comparador (Pro).
- `/app/painel`: visão geral dos planos e progresso.
- `/app/conta`: perfil, assinatura (Customer Portal), exportar dados, excluir conta.

**Admin:** `/admin` com CRUD de caminhos, requisitos (editor do JSON da regra com validação), etapas, documentos, custos e botão "marcar como verificado hoje". Acesso só para `role = 'admin'`.

**SEO técnico:** metadata por página, Open Graph dinâmico, `sitemap.xml` e `robots.txt` gerados, dados estruturados (FAQPage onde houver perguntas frequentes), URLs em português, canonical.

---

## 10. Design: use a skill `/sites-incriveis`

A camada visual é responsabilidade da skill **`/sites-incriveis`**. Invoque-a na Fase 2 e siga o fluxo dela integralmente: inventário, entrevista em rodadas curtas, briefing confirmado, 2 ou 3 direções de arte, e só então construção. Não pule a entrevista.

**Escopo da skill neste projeto:**

- Landing page e páginas públicas (país, caminho, preços): design completo em nível autoral.
- **Sistema de design** que será usado no app inteiro: tokens em `:root` (cores, tipografia, espaços, raios, easing, sombras), claro e escuro, componentes-base (botão, campo, card de caminho, badge de status de requisito, barra de progresso, bloco de fonte oficial, `<LegalNotice />`).
- O app logado **herda** esse sistema. Nas telas do app, priorize clareza, densidade de informação confortável e velocidade; a ousadia fica concentrada no marketing.
- A skill não cuida de backend, banco ou SEO técnico: isso segue as demais seções deste documento.

**Briefing já conhecido** (a skill não deve perguntar de novo o que está aqui, só o que falta):

- **Cliente final:** eu mesmo, fundador do produto. Eu aprovo.
- **Público:** brasileiros de 20 a 45 anos pesquisando como morar na Austrália, Nova Zelândia ou Canadá. Chegam por busca no Google ou por indicação em grupos, muitas vezes pelo celular, com a dúvida "será que eu consigo?".
- **Ação principal:** criar o perfil gratuito (iniciar o onboarding).
- **Sentimento a transmitir:** confiança e clareza antes de entusiasmo. É uma decisão de vida cara e arriscada; o site precisa parecer sério, organizado e honesto, sem cara de "venda de sonho" nem de agência de intercâmbio.
- **Anti-referências:** sites de consultoria com fotos de banco de imagem de pessoas com mala no aeroporto, bandeiras gigantes, promessas de "visto garantido", excesso de urgência.
- **Conteúdo:** ainda não existe copy. Escreva copy clara e honesta, marcada para minha revisão, sempre respeitando as regras da seção 2 (nenhuma promessa de resultado, nenhuma recomendação).
- **Técnico:** Next.js + Tailwind na Vercel; eu mesmo darei manutenção.
- **Em aberto (perguntar na entrevista):** nome e identidade da marca, referências visuais que eu gosto, teto de ousadia, preferência de claro/escuro, fotos ou ilustração.

**Inegociáveis, além dos da skill:** performance (LCP abaixo de 2,5 s no mobile, sem bibliotecas pesadas de animação sem necessidade), acessibilidade AA, `prefers-reduced-motion` respeitado, e o aviso legal sempre legível, nunca escondido em letra miúda.

---

## 11. Analytics, privacidade e segurança

**Eventos de funil:** `landing_view`, `pathway_page_view`, `signup_started`, `signup_completed`, `onboarding_step_completed` (com número da etapa), `onboarding_completed`, `results_viewed`, `pathway_followed`, `checklist_item_done`, `pro_interest`, `checkout_started`, `subscription_active`. Crie um painel simples em `/admin/metricas` com conversão entre as etapas principais e retenção semanal básica.

**LGPD:** banner de consentimento (analytics não essencial só após aceite), política de privacidade explicando quais dados de perfil são coletados e por quê, exportação dos dados do usuário em JSON e exclusão de conta (apagando dados de perfil, planos e checklist).

**Segurança:** service role key só no servidor; nenhuma chave secreta com prefixo `NEXT_PUBLIC_`; RLS em 100% das tabelas; validação Zod em toda entrada; rate limit nas Server Actions sensíveis e, na Fase 7, no endpoint de IA; headers de segurança no `next.config`.

---

## 12. Fases de execução

Pare ao final de cada uma e espere minha aprovação.

**Fase 1: Fundação.** Criar o projeto Next.js, configurar TypeScript, ESLint, Prettier, Tailwind, Vitest, Playwright, GitHub Actions, Supabase CLI local, clients do Supabase, estrutura de pastas, `.env.example` e README com instruções de setup local e deploy. Entregável: projeto rodando localmente com página em branco e CI verde.

**Fase 2: Design com `/sites-incriveis`.** Rodar a skill completa (entrevista, briefing, direções, escolha). Construir tokens, componentes-base e a landing page. Entregável: landing navegável localmente, em claro e escuro, mobile e desktop.

**Fase 3: Banco e conteúdo.** Migrations, RLS, tipos gerados, seed verificado dos caminhos, script `check-sources`, área admin mínima. Entregável: lista dos caminhos publicados e dos que ficaram em rascunho, com motivo.

**Fase 4: Motor de elegibilidade.** Schema das regras, motor, testes. Entregável: relatório dos testes e 3 perfis de exemplo com o resultado gerado para cada um.

**Fase 5: App do usuário.** Auth, onboarding, resultados, detalhe personalizado, acompanhar caminho, checklist, painel, conta (exportar/excluir). Páginas públicas de país e caminho com SEO. Testes E2E do fluxo cadastro → onboarding → resultados → acompanhar caminho → marcar item.

**Fase 6: Monetização e analytics.** Limites do plano gratuito, flag `PAYMENTS_ENABLED`, fake door com `waitlist`, Stripe (checkout, webhook, portal), comparador e simulador de custos Pro, alertas de mudança (lendo `content_changes`), eventos e painel de métricas, banner de consentimento. Entregável: fluxo de assinatura testado com Stripe em modo de teste.

**Fase 7: Assistente de IA (atrás da flag `AI_ENABLED`, desligada por padrão).**

- Ingestão: script que baixa as páginas oficiais das `source_url`, extrai o texto, divide em trechos, gera embeddings e salva em `source_chunks` (`pathway_id`, `url`, `content`, `embedding vector`, `fetched_at`) com índice pgvector.
- Resposta: busca por similaridade nos trechos do contexto do usuário (caminhos que ele acompanha), chamada ao modelo com um system prompt que exige: responder só com base nos trechos, **citar a fonte de cada afirmação**, dizer quando não encontrou a informação, **não recomendar qual visto escolher nem avaliar chances pessoais**, e sugerir um profissional licenciado nesses casos. Aviso legal visível na interface do chat.
- Uso também para: resumir um caminho em linguagem simples e sugerir a ordem dos itens do checklist (sem decidir elegibilidade).
- Cota mensal por usuário em `ai_usage`, conferida no servidor antes de cada chamada; streaming na interface.
- Entregável: 10 perguntas de teste com respostas e citações, incluindo 3 perguntas que devem ser recusadas ou redirecionadas.

**Fase 8: Polimento e lançamento.** Auditoria de acessibilidade e Lighthouse (meta: 90+ em todas as categorias no mobile nas páginas públicas), revisão de copy, páginas de erro e 404 com a identidade visual, checklist de variáveis na Vercel, migrations aplicadas no projeto Supabase remoto (com minha confirmação), deploy de preview e depois produção.

---

## 13. Variáveis de ambiente (`.env.example`)

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_6MONTHS=
PAYMENTS_ENABLED=false
AI_ENABLED=false
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
AI_MONTHLY_MESSAGE_QUOTA=
NEXT_PUBLIC_POSTHOG_KEY=
```

Nunca escreva valores reais de chaves em arquivos versionados nem no chat. Eu preencho `.env.local` e as variáveis da Vercel.

---

## 14. Definição de pronto do MVP

- Um visitante chega por uma página pública de caminho, cria conta, completa o onboarding em menos de 3 minutos, vê os caminhos compatíveis com fontes e aviso legal, acompanha um caminho e marca itens do checklist, no celular e no desktop.
- Nenhuma tela usa linguagem de recomendação; todo requisito exibido tem fonte e data de verificação.
- Limites do plano gratuito aplicados no servidor; fake door ou Stripe funcionando conforme a flag.
- RLS testada, CI verde, Lighthouse mobile 90+ nas páginas públicas.
- Eventos de funil registrados e visíveis no painel de métricas.
- README com setup, deploy, como curar conteúdo no admin e como rodar o `check-sources`.

Comece pela Fase 1: apresente o plano da fase e aguarde minha aprovação.