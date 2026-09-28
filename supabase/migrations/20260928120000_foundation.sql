-- Foundation: enums and shared helpers.
-- Convention: every table has id uuid, created_at, updated_at (kept by trigger).

create type public.pathway_category as enum ('work', 'study', 'residence', 'working_holiday');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.english_level as enum ('none', 'basic', 'intermediate', 'advanced', 'fluent');
create type public.english_test as enum ('IELTS', 'PTE', 'TOEFL', 'CELPIP', 'Duolingo');
create type public.user_goal as enum ('work', 'study', 'residence');
create type public.user_role as enum ('user', 'admin');
create type public.plan_status as enum ('exploring', 'preparing', 'applied', 'paused', 'done');
create type public.checklist_source as enum ('step', 'document', 'custom');
create type public.subscription_plan as enum ('free', 'pro');
create type public.education_level as enum (
  'none',
  'high_school',
  'technical',
  'bachelor',
  'postgraduate',
  'master',
  'doctorate'
);
create type public.marital_status as enum (
  'single',
  'married',
  'stable_union',
  'divorced',
  'widowed'
);

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
