-- Phase 6: free-plan limits are enforced by the database, Pro unlocks them,
-- analytics and rate-limit tables are unreachable from the client.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, aud, role, instance_id) values
  ('00000000-0000-0000-0000-0000000000f1', 'mon-free@goglobe.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-0000000000f2', 'mon-pro@goglobe.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('00000000-0000-0000-0000-0000000000f3', 'mon-admin@goglobe.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');
update public.profiles set role = 'admin' where user_id = '00000000-0000-0000-0000-0000000000f3';

insert into public.countries (id, code, name_pt, currency, official_site_url)
values ('10000000-0000-0000-0000-0000000000f0', 'ZY', 'País de teste', 'AUD', 'https://example.gov/');
insert into public.pathways (id, country_id, slug, official_name, name_pt, category, summary_pt, official_url, status, last_verified_at)
select ('20000000-0000-0000-0000-00000000000' || n)::uuid, '10000000-0000-0000-0000-0000000000f0',
       'mon-' || n, 'P' || n, 'Caminho ' || n, 'work', 'Resumo', 'https://example.gov/', 'published', now()
  from generate_series(1, 3) as n;

-- Pro through an active subscription; the pass case is covered by is_pro below.
insert into public.subscriptions (user_id, plan, status, billing_kind, current_period_end)
values ('00000000-0000-0000-0000-0000000000f2', 'pro', 'active', 'subscription', now() + interval '30 days');

insert into public.events (name, user_id) values ('landing_view', '00000000-0000-0000-0000-0000000000f1');

-- ------------------------------------------------------------- free user --
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);

select is(public.is_pro(), false, 'free user is not Pro');
select lives_ok(
  $$insert into public.user_plans (user_id, pathway_id) values ('00000000-0000-0000-0000-0000000000f1', '20000000-0000-0000-0000-000000000001')$$,
  'free user can follow 1 pathway'
);
select throws_ok(
  $$insert into public.user_plans (user_id, pathway_id) values ('00000000-0000-0000-0000-0000000000f1', '20000000-0000-0000-0000-000000000002')$$,
  '23514', 'free_plan_limit', 'free user cannot follow a 2nd pathway'
);
insert into public.checklist_items (user_plan_id, source_type, title)
select id, 'custom', 'Item' from public.user_plans limit 1;
select throws_ok(
  $$update public.checklist_items set due_date = current_date + 7$$,
  '23514', 'pro_feature', 'free user cannot set due dates (Pro)'
);
select is((select count(*)::int from public.events), 0, 'users see no analytics events');
select throws_ok(
  $$insert into public.events (name) values ('landing_view')$$,
  '42501', null, 'users cannot write analytics events directly'
);
select throws_ok(
  $$select public.hit_rate_limit('x', 1, 60)$$,
  '42501', null, 'users cannot call the rate limiter'
);
select throws_ok($$select * from public.admin_funnel(30)$$, '42501', 'forbidden', 'users cannot read the funnel');
select throws_ok(
  $$update public.subscriptions set plan = 'pro'$$,
  '42501', null, 'users cannot upgrade themselves'
);
reset role;

-- -------------------------------------------------------------- pro user --
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f2","role":"authenticated"}', true);
select is(public.is_pro(), true, 'active subscription is Pro');
select lives_ok(
  $$insert into public.user_plans (user_id, pathway_id)
    select '00000000-0000-0000-0000-0000000000f2', id from public.pathways
     where country_id = '10000000-0000-0000-0000-0000000000f0'$$,
  'Pro user follows several pathways'
);
reset role;

-- An expired pass is no longer Pro.
update public.subscriptions set billing_kind = 'pass', current_period_end = now() - interval '1 day'
 where user_id = '00000000-0000-0000-0000-0000000000f2';
select is(public.is_pro('00000000-0000-0000-0000-0000000000f2'), false, 'expired pass is not Pro');

-- ------------------------------------------------------------------ admin --
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f3","role":"authenticated"}', true);
select ok((select count(*) >= 1 from public.events), 'admin reads events');
select ok(
  (select people >= 1 from public.admin_funnel(30) where step = 'landing_view'),
  'admin funnel counts people per step'
);
reset role;

select * from finish();
rollback;
