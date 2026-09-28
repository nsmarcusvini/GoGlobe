-- RLS proofs: users never see or change each other's data; content visibility
-- follows the pathway status; only admins write content; roles can't be self-escalated.
-- Run with: npm run db:test
begin;
create extension if not exists pgtap with schema extensions;

select plan(36);

-- ---------------------------------------------------------------- fixtures --
-- Fixtures live in a fake country (ZZ) so the assertions ignore seeded content.
-- Auth users (the signup trigger creates their profiles).
insert into auth.users (id, email, aud, role, instance_id)
values
  ('00000000-0000-0000-0000-00000000000a', 'rls-ana@goglobe.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-bruno@goglobe.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-0000000000ad', 'rls-admin@goglobe.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');

update public.profiles set role = 'admin'
 where user_id = '00000000-0000-0000-0000-0000000000ad';

insert into public.countries (id, code, name_pt, currency, official_site_url)
values ('10000000-0000-0000-0000-000000000001', 'ZZ', 'País de teste', 'AUD', 'https://immi.homeaffairs.gov.au/');

insert into public.pathways (id, country_id, slug, official_name, name_pt, category, summary_pt, official_url, status, last_verified_at)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'publicado', 'Published', 'Publicado', 'work', 'Resumo', 'https://immi.homeaffairs.gov.au/', 'published', now()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'rascunho', 'Draft', 'Rascunho', 'work', 'Resumo', 'https://immi.homeaffairs.gov.au/', 'draft', null);

insert into public.requirements (pathway_id, key, label_pt, rule, source_url, last_verified_at)
values
  ('20000000-0000-0000-0000-000000000001', 'age', 'Idade', '{"op":"age_max","value":44}', 'https://immi.homeaffairs.gov.au/', now()),
  ('20000000-0000-0000-0000-000000000002', 'age', 'Idade', '{"op":"age_max","value":44}', 'https://immi.homeaffairs.gov.au/', now());

insert into public.user_plans (id, user_id, pathway_id)
values
  ('30000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001');

insert into public.checklist_items (user_plan_id, source_type, title)
values
  ('30000000-0000-0000-0000-00000000000a', 'custom', 'Item da Ana'),
  ('30000000-0000-0000-0000-00000000000b', 'custom', 'Item do Bruno');

insert into public.subscriptions (user_id, plan)
values
  ('00000000-0000-0000-0000-00000000000a', 'free'),
  ('00000000-0000-0000-0000-00000000000b', 'pro');

insert into public.waitlist (email, source) values ('lead@goglobe.test', 'test');

-- ------------------------------------------------------------------- setup --
select ok(
  (select count(*) = 3 from public.profiles where user_id in (
    '00000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-0000000000ad')),
  'signup trigger creates one profile per user'
);

select ok(
  (select bool_and(c.relrowsecurity) from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'),
  'RLS is enabled on every public table'
);

-- -------------------------------------------------------------------- anon --
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*)::int from public.pathways where country_id = '10000000-0000-0000-0000-000000000001'), 1, 'anon sees only published pathways');
select is((select count(*)::int from public.requirements where pathway_id in ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')), 1, 'anon sees only requirements of published pathways');
select is((select count(*)::int from public.profiles), 0, 'anon sees no profiles');
select is((select count(*)::int from public.user_plans), 0, 'anon sees no plans');
select is((select count(*)::int from public.checklist_items), 0, 'anon sees no checklist items');
select throws_ok(
  $$select count(*) from public.waitlist$$,
  '42501', null, 'anon cannot read the waitlist'
);
select throws_ok(
  $$insert into public.waitlist (email) values ('x@y.com')$$,
  '42501', null, 'anon cannot write the waitlist directly'
);
select throws_ok(
  $$insert into public.pathways (country_id, slug, official_name, name_pt, category, summary_pt, official_url)
    values ('10000000-0000-0000-0000-000000000001', 'hack', 'x', 'x', 'work', 'x', 'https://x.com')$$,
  '42501', null, 'anon cannot write content'
);

reset role;

-- ------------------------------------------------------------- user: Ana ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select is((select count(*)::int from public.profiles), 1, 'Ana sees exactly one profile');
select is(
  (select user_id from public.profiles),
  '00000000-0000-0000-0000-00000000000a'::uuid,
  '... and it is her own'
);
select is((select count(*)::int from public.user_plans), 1, 'Ana sees only her plan');
select is(
  (select title from public.checklist_items),
  'Item da Ana',
  'Ana sees only her checklist items'
);
select is((select count(*)::int from public.subscriptions), 1, 'Ana sees only her subscription');
select is((select plan::text from public.subscriptions), 'free', '... which is hers (free)');
select is((select count(*)::int from public.pathways where country_id = '10000000-0000-0000-0000-000000000001'), 1, 'regular user does not see drafts');
select is((select count(*)::int from public.content_changes), 0, 'regular user cannot read the change log');

-- Writes against Bruno's rows affect nothing.
update public.user_plans set notes = 'hack' where id = '30000000-0000-0000-0000-00000000000b';
update public.checklist_items set is_done = true
 where user_plan_id = '30000000-0000-0000-0000-00000000000b';
delete from public.user_plans where id = '30000000-0000-0000-0000-00000000000b';

select throws_ok(
  $$insert into public.user_plans (user_id, pathway_id)
    values ('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'Ana cannot create a plan for Bruno'
);
select throws_ok(
  $$insert into public.checklist_items (user_plan_id, source_type, title)
    values ('30000000-0000-0000-0000-00000000000b', 'custom', 'intruso')$$,
  '42501', null, 'Ana cannot add items to Bruno''s plan'
);
select throws_ok(
  $$update public.profiles set role = 'admin'$$,
  '42501', null, 'Ana cannot promote herself to admin'
);
select throws_ok(
  $$update public.subscriptions set plan = 'pro'$$,
  '42501', null, 'Ana cannot upgrade her own subscription'
);
-- RLS filters the rows silently (0 affected); verified below as superuser.
update public.pathways set name_pt = 'hack' where country_id = '10000000-0000-0000-0000-000000000001';

-- Own data is writable.
update public.profiles set occupation_text = 'Enfermeira';
select is((select occupation_text from public.profiles), 'Enfermeira', 'Ana updates her own profile');
select lives_ok(
  $$insert into public.checklist_items (user_plan_id, source_type, title)
    values ('30000000-0000-0000-0000-00000000000a', 'custom', 'Novo item')$$,
  'Ana adds items to her own plan'
);

reset role;

-- Bruno's data is untouched (checked as superuser).
select is(
  (select notes from public.user_plans where id = '30000000-0000-0000-0000-00000000000b'),
  null,
  'Bruno''s plan notes are untouched'
);
select is(
  (select count(*)::int from public.user_plans where id = '30000000-0000-0000-0000-00000000000b'),
  1,
  'Bruno''s plan was not deleted'
);
select is(
  (select bool_or(is_done) from public.checklist_items
    where user_plan_id = '30000000-0000-0000-0000-00000000000b'),
  false,
  'Bruno''s items were not marked done'
);
select is(
  (select count(*)::int from public.pathways where name_pt = 'hack'),
  0,
  'regular user cannot edit content'
);

-- Version baseline (adding the fixture requirement to a published pathway already bumped it).
create temp table baseline on commit drop as
  select version from public.pathways where id = '20000000-0000-0000-0000-000000000001';
grant select on baseline to authenticated;

-- ------------------------------------------------------------------ admin ---
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}', true);

select is((select count(*)::int from public.pathways where country_id = '10000000-0000-0000-0000-000000000001'), 2, 'admin sees drafts too');
select is((select count(*)::int from public.user_plans), 0, 'admin does not read users'' plans (LGPD)');
select lives_ok(
  $$update public.requirements set rule = '{"op":"age_max","value":45}'
     where pathway_id = '20000000-0000-0000-0000-000000000001'$$,
  'admin edits content'
);

reset role;

-- --------------------------------------------------------- change tracking --
select ok(
  (select count(*) > 0 from public.content_changes
    where table_name = 'requirements' and action = 'update'
      and 'rule' = any (changed_fields)
      and changed_by = '00000000-0000-0000-0000-0000000000ad'),
  'content edits are logged with field and author'
);
select is(
  (select version from public.pathways where id = '20000000-0000-0000-0000-000000000001'),
  (select version + 1 from baseline),
  'a substantive change bumps the published pathway version'
);

update public.pathways set last_verified_at = now() + interval '1 minute'
 where id = '20000000-0000-0000-0000-000000000001';
select is(
  (select version from public.pathways where id = '20000000-0000-0000-0000-000000000001'),
  (select version + 1 from baseline),
  're-verifying does not bump the version'
);
select ok(
  (select not is_substantive from public.content_changes
    where table_name = 'pathways' and 'last_verified_at' = any (changed_fields)
    order by created_at desc limit 1),
  're-verification is logged as non-substantive'
);

select throws_ok(
  $$update public.pathways set status = 'published' where id = '20000000-0000-0000-0000-000000000002'$$,
  '23514', null, 'a pathway cannot be published without a verification date'
);

select * from finish();
rollback;
