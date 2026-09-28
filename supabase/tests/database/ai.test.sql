-- Phase 7: source chunks follow their pathway's visibility, only the service
-- role writes them, and the monthly AI quota is spent atomically.
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email, aud, role, instance_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'ai-user@goglobe.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');

insert into public.countries (id, code, name_pt, currency, official_site_url)
values ('10000000-0000-0000-0000-0000000000a0', 'ZX', 'País de teste', 'AUD', 'https://example.gov/');
insert into public.pathways (id, country_id, slug, official_name, name_pt, category, summary_pt, official_url, status, last_verified_at, draft_reason)
values
  ('20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a0', 'ai-pub', 'Pub', 'Publicado', 'work', 'Resumo', 'https://example.gov/', 'published', now(), null),
  ('20000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-0000000000a0', 'ai-draft', 'Draft', 'Rascunho', 'work', 'Resumo', 'https://example.gov/', 'draft', null, 'teste');

-- Two orthogonal unit vectors so similarity ordering is predictable.
insert into public.source_chunks (pathway_id, url, origin, chunk_index, content, content_hash, embedding, embedding_model, fetched_at)
values
  ('20000000-0000-0000-0000-0000000000a1', 'https://example.gov/a', 'official_page', 0, 'idade', 'h1',
   ('[1' || repeat(',0', 1023) || ']')::extensions.vector, 'mock', now()),
  ('20000000-0000-0000-0000-0000000000a1', 'https://example.gov/b', 'curated', 0, 'inglês', 'h2',
   ('[0,1' || repeat(',0', 1022) || ']')::extensions.vector, 'mock', now()),
  ('20000000-0000-0000-0000-0000000000a2', 'https://example.gov/c', 'official_page', 0, 'rascunho', 'h3',
   ('[1' || repeat(',0', 1023) || ']')::extensions.vector, 'mock', now());

-- ---------------------------------------------------------------- reading --
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.source_chunks where pathway_id in ('20000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000a2')),
  2, 'users read chunks of published pathways only'
);
select is(
  (select content from public.match_source_chunks(
     ('[1' || repeat(',0', 1023) || ']')::extensions.vector,
     array['20000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000a2']::uuid[],
     'mock', 5) limit 1),
  'idade', 'match returns the closest chunk first'
);
select is(
  (select count(*)::int from public.match_source_chunks(
     ('[1' || repeat(',0', 1023) || ']')::extensions.vector,
     array['20000000-0000-0000-0000-0000000000a2']::uuid[], 'mock', 5)),
  0, 'match never returns chunks of a draft pathway'
);
select is(
  (select count(*)::int from public.match_source_chunks(
     ('[1' || repeat(',0', 1023) || ']')::extensions.vector,
     array['20000000-0000-0000-0000-0000000000a1']::uuid[], 'other-model', 5)),
  0, 'match only compares vectors from the same embedding model'
);
select throws_ok(
  $$insert into public.source_chunks (pathway_id, url, origin, chunk_index, content, content_hash, embedding, embedding_model, fetched_at)
    values ('20000000-0000-0000-0000-0000000000a1', 'https://example.gov/x', 'curated', 9, 'x', 'x', ('[1' || repeat(',0', 1023) || ']')::extensions.vector, 'mock', now())$$,
  '42501', null, 'users cannot write chunks'
);
select throws_ok(
  $$select * from public.consume_ai_message('00000000-0000-0000-0000-0000000000a1', 100)$$,
  '42501', null, 'users cannot spend quota themselves'
);
select throws_ok(
  $$insert into public.ai_usage (user_id, period_start, messages_used) values ('00000000-0000-0000-0000-0000000000a1', current_date, 0)$$,
  '42501', null, 'users cannot write their own usage'
);
reset role;

set local role anon;
select is(
  (select count(*)::int from public.source_chunks where pathway_id = '20000000-0000-0000-0000-0000000000a1'),
  2, 'published chunks are public official text'
);
reset role;

-- ------------------------------------------------------------------ quota --
set local role service_role;
select is(
  (select allowed from public.consume_ai_message('00000000-0000-0000-0000-0000000000a1', 2)),
  true, '1st message of 2 is allowed'
);
select is(
  (select used from public.consume_ai_message('00000000-0000-0000-0000-0000000000a1', 2)),
  2, '2nd message of 2 is allowed and counted'
);
select is(
  (select allowed from public.consume_ai_message('00000000-0000-0000-0000-0000000000a1', 2)),
  false, '3rd message is refused once the quota is spent'
);
select public.refund_ai_message('00000000-0000-0000-0000-0000000000a1');
select is(
  (select messages_used from public.ai_usage where user_id = '00000000-0000-0000-0000-0000000000a1'),
  1, 'a failed call gives the message back'
);
reset role;

select * from finish();
rollback;
