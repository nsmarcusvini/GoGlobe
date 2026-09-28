-- User-owned data. Each user only reads/writes their own rows (RLS in the next migration).

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  birth_date date check (birth_date is null or birth_date > date '1900-01-01'),
  occupation_text text check (occupation_text is null or length(occupation_text) <= 200),
  occupation_id uuid references public.occupations (id) on delete set null,
  education_level public.education_level,
  years_experience integer check (years_experience is null or years_experience between 0 and 60),
  english_level public.english_level,
  english_test public.english_test,
  english_score numeric(5, 1) check (english_score is null or english_score >= 0),
  marital_status public.marital_status,
  has_children boolean,
  budget_brl numeric(14, 2) check (budget_brl is null or budget_brl >= 0),
  goal public.user_goal,
  target_countries text[] not null default '{}',
  role public.user_role not null default 'user',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (english_score is null or english_test is not null)
);

create table public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pathway_id uuid not null references public.pathways (id) on delete cascade,
  -- Pathway version when the user started following it (for change alerts).
  pathway_version integer not null default 1,
  status public.plan_status not null default 'exploring',
  notes text check (notes is null or length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, pathway_id)
);
create index user_plans_pathway_id_idx on public.user_plans (pathway_id);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_plan_id uuid not null references public.user_plans (id) on delete cascade,
  source_type public.checklist_source not null,
  -- pathway_steps.id or documents.id; null for custom items.
  source_id uuid,
  title text not null check (length(title) between 1 and 300),
  is_done boolean not null default false,
  done_at timestamptz,
  due_date date,
  notes text check (notes is null or length(notes) <= 5000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_type = 'custom' or source_id is not null)
);
create index checklist_items_user_plan_id_idx on public.checklist_items (user_plan_id);

-- Written only by the Stripe webhook (service role).
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan public.subscription_plan not null default 'free',
  status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Phase 7: monthly AI quota. Written only from the server.
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  messages_used integer not null default 0 check (messages_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start)
);

-- Fake-door waitlist. Written only from the server (validated + rate limited).
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.user_plans
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.checklist_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.ai_usage
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.waitlist
  for each row execute function public.set_updated_at();

-- Keeps done_at in sync with is_done.
create or replace function public.sync_checklist_done_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_done and (tg_op = 'INSERT' or not old.is_done) then
    new.done_at := now();
  elsif not new.is_done then
    new.done_at := null;
  end if;
  return new;
end;
$$;

create trigger sync_done_at before insert or update on public.checklist_items
  for each row execute function public.sync_checklist_done_at();

-- Every new auth user gets an empty profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role changes only through trusted server code (service role / SQL), never by the user.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') in ('anon', 'authenticated') then
    raise exception 'Alteração de papel não permitida'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();
