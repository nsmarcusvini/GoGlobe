-- Row Level Security on 100% of public tables.
--   Content: published rows readable by everyone; writes only for admins.
--   User data: only the owner (auth.uid()). No admin read of personal data (LGPD).
--   subscriptions / ai_usage / waitlist: written only by the service role.
-- auth.uid() is wrapped in (select ...) so it is evaluated once per statement.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
     where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.countries enable row level security;
alter table public.pathways enable row level security;
alter table public.requirements enable row level security;
alter table public.pathway_steps enable row level security;
alter table public.documents enable row level security;
alter table public.cost_items enable row level security;
alter table public.occupations enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.content_changes enable row level security;
alter table public.profiles enable row level security;
alter table public.user_plans enable row level security;
alter table public.checklist_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_usage enable row level security;
alter table public.waitlist enable row level security;

-- ------------------------------------------------------------------ content --

create policy "countries: public read active" on public.countries
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "countries: admin insert" on public.countries
  for insert to authenticated with check ((select public.is_admin()));
create policy "countries: admin update" on public.countries
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "countries: admin delete" on public.countries
  for delete to authenticated using ((select public.is_admin()));

create policy "pathways: public read published" on public.pathways
  for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));
create policy "pathways: admin insert" on public.pathways
  for insert to authenticated with check ((select public.is_admin()));
create policy "pathways: admin update" on public.pathways
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "pathways: admin delete" on public.pathways
  for delete to authenticated using ((select public.is_admin()));

-- Child content follows the visibility of its pathway.
create policy "requirements: read with pathway" on public.requirements
  for select to anon, authenticated
  using (exists (
    select 1 from public.pathways p
     where p.id = pathway_id and (p.status = 'published' or (select public.is_admin()))
  ));
create policy "requirements: admin insert" on public.requirements
  for insert to authenticated with check ((select public.is_admin()));
create policy "requirements: admin update" on public.requirements
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "requirements: admin delete" on public.requirements
  for delete to authenticated using ((select public.is_admin()));

create policy "pathway_steps: read with pathway" on public.pathway_steps
  for select to anon, authenticated
  using (exists (
    select 1 from public.pathways p
     where p.id = pathway_id and (p.status = 'published' or (select public.is_admin()))
  ));
create policy "pathway_steps: admin insert" on public.pathway_steps
  for insert to authenticated with check ((select public.is_admin()));
create policy "pathway_steps: admin update" on public.pathway_steps
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "pathway_steps: admin delete" on public.pathway_steps
  for delete to authenticated using ((select public.is_admin()));

create policy "documents: read with pathway" on public.documents
  for select to anon, authenticated
  using (exists (
    select 1 from public.pathways p
     where p.id = pathway_id and (p.status = 'published' or (select public.is_admin()))
  ));
create policy "documents: admin insert" on public.documents
  for insert to authenticated with check ((select public.is_admin()));
create policy "documents: admin update" on public.documents
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "documents: admin delete" on public.documents
  for delete to authenticated using ((select public.is_admin()));

create policy "cost_items: read with pathway" on public.cost_items
  for select to anon, authenticated
  using (exists (
    select 1 from public.pathways p
     where p.id = pathway_id and (p.status = 'published' or (select public.is_admin()))
  ));
create policy "cost_items: admin insert" on public.cost_items
  for insert to authenticated with check ((select public.is_admin()));
create policy "cost_items: admin update" on public.cost_items
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "cost_items: admin delete" on public.cost_items
  for delete to authenticated using ((select public.is_admin()));

create policy "occupations: public read" on public.occupations
  for select to anon, authenticated using (true);
create policy "occupations: admin insert" on public.occupations
  for insert to authenticated with check ((select public.is_admin()));
create policy "occupations: admin update" on public.occupations
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "occupations: admin delete" on public.occupations
  for delete to authenticated using ((select public.is_admin()));

create policy "exchange_rates: public read" on public.exchange_rates
  for select to anon, authenticated using (true);
create policy "exchange_rates: admin insert" on public.exchange_rates
  for insert to authenticated with check ((select public.is_admin()));
create policy "exchange_rates: admin update" on public.exchange_rates
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Change log: admins read; rows are only written by the security-definer trigger.
create policy "content_changes: admin read" on public.content_changes
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------- user data --

create policy "profiles: owner read" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profiles: owner update" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- No insert/delete policies: profiles are created by the signup trigger and
-- removed with the auth user (account deletion runs server-side).

-- Users can never write their own role, even through a crafted request.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (
  birth_date, occupation_text, occupation_id, education_level, years_experience,
  english_level, english_test, english_score, marital_status, has_children,
  budget_brl, goal, target_countries, onboarding_completed_at
) on public.profiles to authenticated;

create policy "user_plans: owner read" on public.user_plans
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_plans: owner insert" on public.user_plans
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_plans: owner update" on public.user_plans
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "user_plans: owner delete" on public.user_plans
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "checklist_items: owner read" on public.checklist_items
  for select to authenticated using (exists (
    select 1 from public.user_plans up
     where up.id = user_plan_id and up.user_id = (select auth.uid())
  ));
create policy "checklist_items: owner insert" on public.checklist_items
  for insert to authenticated with check (exists (
    select 1 from public.user_plans up
     where up.id = user_plan_id and up.user_id = (select auth.uid())
  ));
create policy "checklist_items: owner update" on public.checklist_items
  for update to authenticated
  using (exists (
    select 1 from public.user_plans up
     where up.id = user_plan_id and up.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.user_plans up
     where up.id = user_plan_id and up.user_id = (select auth.uid())
  ));
create policy "checklist_items: owner delete" on public.checklist_items
  for delete to authenticated using (exists (
    select 1 from public.user_plans up
     where up.id = user_plan_id and up.user_id = (select auth.uid())
  ));

create policy "subscriptions: owner read" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.subscriptions from anon, authenticated;

create policy "ai_usage: owner read" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.ai_usage from anon, authenticated;

-- waitlist: no policies at all (service role only).
revoke all on public.waitlist from anon, authenticated;
