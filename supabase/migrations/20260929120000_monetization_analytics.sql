-- Phase 6: freemium limits, Stripe bookkeeping, product analytics, rate limits.

-- ------------------------------------------------------------ subscriptions --
-- 'subscription' = monthly Stripe subscription; 'pass' = one-off 6-month pass.
alter table public.subscriptions
  add column billing_kind text check (billing_kind in ('subscription', 'pass')),
  add column stripe_price_id text;

-- Pro = an active/trialing subscription, or a pass still within its period.
create or replace function public.is_pro(target uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
     where s.user_id = coalesce(target, (select auth.uid()))
       and s.plan = 'pro'
       and s.status in ('active', 'trialing')
       and (s.current_period_end is null or s.current_period_end > now())
  );
$$;
revoke all on function public.is_pro(uuid) from public;
grant execute on function public.is_pro(uuid) to authenticated;

-- ------------------------------------------------------------ free limits --
-- Free plan: 1 followed pathway. Enforced here so no client can bypass it.
create or replace function public.enforce_free_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Rows for someone else are left to RLS, so its generic denial answers and
  -- nothing leaks about the other user (e.g. how many plans they follow).
  if auth.uid() is not null and new.user_id <> auth.uid() then
    return new;
  end if;
  if not public.is_pro(new.user_id)
     and (select count(*) from public.user_plans where user_id = new.user_id) >= 1 then
    raise exception 'free_plan_limit'
      using errcode = 'check_violation',
            hint = 'O plano gratuito permite acompanhar 1 caminho.';
  end if;
  return new;
end;
$$;

create trigger enforce_free_limit before insert on public.user_plans
  for each row execute function public.enforce_free_plan_limit();

-- Pro-only fields: due dates on checklist items.
create or replace function public.enforce_pro_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  if new.due_date is distinct from (case when tg_op = 'UPDATE' then old.due_date end)
     and new.due_date is not null then
    select user_id into owner from public.user_plans where id = new.user_plan_id;
    if not public.is_pro(owner) then
      raise exception 'pro_feature' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_pro_fields before insert or update on public.checklist_items
  for each row execute function public.enforce_pro_fields();

-- Cost simulator lines kept per plan (Pro edits them; free reads the summary).
alter table public.user_plans
  add column simulator jsonb not null default '{}'::jsonb
    check (jsonb_typeof(simulator) = 'object');

-- -------------------------------------------------------------- stripe log --
-- Idempotency: each Stripe event id is processed once.
create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;

-- ------------------------------------------------------------------ events --
-- First-party product analytics (recorded only with consent, server-side).
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name in (
    'landing_view', 'pathway_page_view', 'signup_started', 'signup_completed',
    'onboarding_step_completed', 'onboarding_completed', 'results_viewed',
    'pathway_followed', 'checklist_item_done', 'pro_interest', 'checkout_started',
    'subscription_active'
  )),
  -- Deleted with the account (LGPD); anonymous events keep only a random id.
  user_id uuid references auth.users (id) on delete cascade,
  anonymous_id text check (anonymous_id is null or length(anonymous_id) <= 64),
  props jsonb not null default '{}'::jsonb check (jsonb_typeof(props) = 'object'),
  path text check (path is null or length(path) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_name_created_at_idx on public.events (name, created_at);
create index events_user_id_idx on public.events (user_id);
alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;
create policy "events: admin read" on public.events
  for select to authenticated using ((select public.is_admin()));
grant select on public.events to authenticated;

-- ------------------------------------------------------------- rate limits --
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Fixed-window counter. Returns true when the call is allowed.
create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  current_hits integer;
begin
  insert into public.rate_limits (key, window_start, hits) values (p_key, bucket, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into current_hits;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return current_hits <= p_limit;
end;
$$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;

-- ------------------------------------------------------ pathway change feed --
-- Pro alerts: substantive changes to a published pathway since a date.
-- Exposes only what changed and when (never before/after values or authors).
create or replace function public.pathway_changes_since(p_pathway uuid, p_since timestamptz)
returns table (changed_at timestamptz, table_name text, changed_fields text[], action text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.created_at, c.table_name, c.changed_fields, c.action
    from public.content_changes c
    join public.pathways p on p.id = c.pathway_id and p.status = 'published'
   where c.pathway_id = p_pathway
     and c.is_substantive
     and c.created_at > p_since
   order by c.created_at desc
   limit 50;
$$;
revoke all on function public.pathway_changes_since(uuid, timestamptz) from public;
grant execute on function public.pathway_changes_since(uuid, timestamptz) to authenticated;

-- ---------------------------------------------------------------- metrics --
-- Funnel: distinct people (user or anonymous id) per step in the window.
create or replace function public.admin_funnel(p_days integer default 30)
returns table (step text, people bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return query
    with steps(step, ord) as (
      values ('landing_view', 1), ('signup_started', 2), ('signup_completed', 3),
             ('onboarding_completed', 4), ('results_viewed', 5), ('pathway_followed', 6),
             ('pro_interest', 7), ('checkout_started', 8), ('subscription_active', 9)
    )
    select s.step,
           (select count(distinct coalesce(e.user_id::text, e.anonymous_id))
              from public.events e
             where e.name = s.step and e.created_at > now() - make_interval(days => p_days))
      from steps s
     order by s.ord;
end;
$$;
revoke all on function public.admin_funnel(integer) from public;
grant execute on function public.admin_funnel(integer) to authenticated;

-- Weekly retention: signup-week cohorts × weeks since signup with any event.
create or replace function public.admin_retention(p_weeks integer default 8)
returns table (cohort date, size bigint, week integer, active bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;
  return query
    with users as (
      select u.id, date_trunc('week', u.created_at)::date as cohort
        from auth.users u
       where u.created_at > date_trunc('week', now()) - make_interval(weeks => p_weeks)
    ),
    cohorts as (
      select users.cohort, count(*) as size from users group by users.cohort
    ),
    activity as (
      select distinct e.user_id,
             floor(extract(epoch from (date_trunc('week', e.created_at) - us.cohort)) / 604800)::integer as week
        from public.events e
        join users us on us.id = e.user_id
    )
    select c.cohort, c.size, a.week, count(distinct a.user_id)
      from cohorts c
      join users us on us.cohort = c.cohort
      join activity a on a.user_id = us.id and a.week >= 0
     group by c.cohort, c.size, a.week
     order by c.cohort, a.week;
end;
$$;
revoke all on function public.admin_retention(integer) from public;
grant execute on function public.admin_retention(integer) to authenticated;

create trigger set_updated_at before update on public.stripe_events
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.rate_limits
  for each row execute function public.set_updated_at();
