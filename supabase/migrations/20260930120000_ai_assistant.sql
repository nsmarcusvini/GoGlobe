-- Phase 7: AI assistant.
--   source_chunks: official text (and our curated, source-linked summaries) split
--   into chunks with embeddings, searched by similarity before each answer.
--   ai_usage: monthly message quota, consumed atomically by the server.

create extension if not exists vector with schema extensions;

-- official_page: text extracted from the source_url itself.
-- curated: our verified summary of a requirement/step/document/cost, which
-- always carries the official source_url it was written from. Used when an
-- official site blocks automated reading (e.g. Home Affairs answers 403).
create type public.chunk_origin as enum ('official_page', 'curated');

create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references public.pathways (id) on delete cascade,
  url text not null check (url ~ '^https://'),
  title text,
  origin public.chunk_origin not null,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (length(content) between 1 and 8000),
  content_hash text not null,
  embedding extensions.vector(1024) not null,
  -- Which embedding model produced the vector; searches only compare like with like.
  embedding_model text not null,
  -- When the text was read (official_page) or last verified by a curator (curated).
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pathway_id, url, origin, chunk_index)
);
create index source_chunks_pathway_id_idx on public.source_chunks (pathway_id);
create index source_chunks_embedding_idx on public.source_chunks
  using hnsw (embedding extensions.vector_cosine_ops);
create trigger set_updated_at before update on public.source_chunks
  for each row execute function public.set_updated_at();

alter table public.source_chunks enable row level security;

-- Public official text: readable with the same rule as its pathway. Written
-- only by the ingestion script (service role).
create policy "source_chunks: read with published pathway" on public.source_chunks
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.pathways p
       where p.id = pathway_id
         and (p.status = 'published' or (select public.is_admin()))
    )
  );
revoke insert, update, delete on public.source_chunks from anon, authenticated;

-- Similarity search limited to the given pathways. Runs as the caller, so RLS
-- still decides which chunks are visible.
create or replace function public.match_source_chunks(
  query_embedding extensions.vector(1024),
  pathway_ids uuid[],
  model text,
  match_count integer default 8
)
returns table (
  id uuid,
  pathway_id uuid,
  url text,
  title text,
  origin public.chunk_origin,
  content text,
  fetched_at timestamptz,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id, c.pathway_id, c.url, c.title, c.origin, c.content, c.fetched_at,
         1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
    from public.source_chunks c
   where c.pathway_id = any (pathway_ids)
     and c.embedding_model = model
   order by c.embedding operator(extensions.<=>) query_embedding
   limit least(greatest(match_count, 1), 20);
$$;

-- Quota periods follow the calendar month in Brasília time.
create or replace function public.ai_period_start()
returns date
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
$$;

-- Atomically spends one message of the monthly quota. Returns allowed=false,
-- without spending, once the limit is reached.
create or replace function public.consume_ai_message(p_user uuid, p_limit integer)
returns table (allowed boolean, used integer, quota integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period date := public.ai_period_start();
  v_used integer;
begin
  insert into public.ai_usage (user_id, period_start, messages_used)
  values (p_user, v_period, 0)
  on conflict (user_id, period_start) do nothing;

  update public.ai_usage
     set messages_used = messages_used + 1
   where user_id = p_user and period_start = v_period and messages_used < p_limit
  returning messages_used into v_used;

  if v_used is null then
    select messages_used into v_used
      from public.ai_usage where user_id = p_user and period_start = v_period;
    return query select false, v_used, p_limit;
  else
    return query select true, v_used, p_limit;
  end if;
end;
$$;

-- Gives a message back when the model call failed before answering.
create or replace function public.refund_ai_message(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage
     set messages_used = greatest(messages_used - 1, 0)
   where user_id = p_user and period_start = public.ai_period_start();
$$;

revoke execute on function public.consume_ai_message(uuid, integer) from public, anon, authenticated;
revoke execute on function public.refund_ai_message(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_message(uuid, integer) to service_role;
grant execute on function public.refund_ai_message(uuid) to service_role;

-- Product event for assistant use (consent-gated like the others).
alter table public.events drop constraint events_name_check;
alter table public.events add constraint events_name_check check (name in (
  'landing_view', 'pathway_page_view', 'signup_started', 'signup_completed',
  'onboarding_step_completed', 'onboarding_completed', 'results_viewed',
  'pathway_followed', 'checklist_item_done', 'pro_interest', 'checkout_started',
  'subscription_active', 'ai_message'
));
