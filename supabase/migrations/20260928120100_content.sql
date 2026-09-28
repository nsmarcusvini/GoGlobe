-- Content tables (public read of published content, admin-only writes; RLS in a later migration).
-- Every requirement, cost and step carries its official source URL.

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{2}$'),
  name_pt text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  official_site_url text not null check (official_site_url ~ '^https://'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pathways (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  official_name text not null,
  name_pt text not null,
  category public.pathway_category not null,
  summary_pt text not null,
  typical_duration_text text,
  leads_to_residence boolean not null default false,
  status public.content_status not null default 'draft',
  -- Main official page for the pathway (also shown as the pathway's source).
  official_url text not null check (official_url ~ '^https://'),
  -- Official points calculator, when the program uses one (we never re-implement it).
  points_calculator_url text check (points_calculator_url ~ '^https://'),
  -- Internal: why this pathway is still a draft (what could not be verified).
  draft_reason text,
  last_verified_at timestamptz,
  -- Bumped automatically on substantive changes; plans store the version they followed.
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, slug),
  -- Published content must have been verified.
  check (status <> 'published' or last_verified_at is not null)
);
create index pathways_country_id_idx on public.pathways (country_id);
create index pathways_status_idx on public.pathways (status);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references public.pathways (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9_]+$'),
  label_pt text not null,
  description_pt text,
  -- Eligibility rule, validated by the Zod schema in src/lib/eligibility/rules.ts.
  rule jsonb not null check (jsonb_typeof(rule) = 'object' and rule ? 'op'),
  is_hard boolean not null default false,
  source_url text not null check (source_url ~ '^https://'),
  last_verified_at timestamptz not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pathway_id, key)
);
create index requirements_pathway_id_idx on public.requirements (pathway_id);

create table public.pathway_steps (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references public.pathways (id) on delete cascade,
  step_order integer not null,
  title_pt text not null,
  description_pt text,
  estimated_duration_text text,
  source_url text not null check (source_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pathway_id, step_order)
);
create index pathway_steps_pathway_id_idx on public.pathway_steps (pathway_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references public.pathways (id) on delete cascade,
  name_pt text not null,
  description_pt text,
  needs_translation boolean not null default false,
  needs_apostille boolean not null default false,
  source_url text not null check (source_url ~ '^https://'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_pathway_id_idx on public.documents (pathway_id);

create table public.cost_items (
  id uuid primary key default gen_random_uuid(),
  pathway_id uuid not null references public.pathways (id) on delete cascade,
  label_pt text not null,
  amount_min numeric(12, 2) not null check (amount_min >= 0),
  amount_max numeric(12, 2) check (amount_max is null or amount_max >= amount_min),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  is_mandatory boolean not null default true,
  -- false = official government fee; true = typical cost, shown labelled as an estimate.
  is_estimate boolean not null default false,
  source_url text not null check (source_url ~ '^https://'),
  last_verified_at timestamptz not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cost_items_pathway_id_idx on public.cost_items (pathway_id);

create table public.occupations (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete cascade,
  code text not null,
  name_en text not null,
  name_pt text,
  list_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_id, list_name, code)
);
create index occupations_country_id_idx on public.occupations (country_id);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency text not null unique check (currency ~ '^[A-Z]{3}$'),
  -- How many BRL one unit of `currency` buys.
  brl_rate numeric(12, 6) not null check (brl_rate > 0),
  source text not null,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit log of content edits: who, when, which fields, before/after.
-- Feeds the Pro "pathway changed" alerts.
create table public.content_changes (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  pathway_id uuid references public.pathways (id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_fields text[] not null default '{}',
  before jsonb,
  after jsonb,
  -- true when the change affects what users see (not just a re-verification).
  is_substantive boolean not null default true,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_changes_pathway_id_created_at_idx
  on public.content_changes (pathway_id, created_at desc);

-- updated_at triggers
create trigger set_updated_at before update on public.countries
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pathways
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.requirements
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pathway_steps
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cost_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.occupations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.exchange_rates
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.content_changes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Change log + versioning
-- Fields that do not change what the user sees: editing only these is a
-- re-verification, not a substantive change (no version bump, no alert).
-- ---------------------------------------------------------------------------
create or replace function public.log_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  row_data jsonb := coalesce(new_row, old_row);
  ignored text[] := array['updated_at', 'last_verified_at', 'version', 'draft_reason'];
  fields text[];
  substantive boolean;
  target_pathway uuid;
begin
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), '{}')
      into fields
      from jsonb_each(new_row) as n(key, value)
     where n.value is distinct from old_row -> n.key;
    if fields = '{}' then
      return new;
    end if;
  else
    fields := '{}';
  end if;

  substantive := tg_op <> 'UPDATE' or exists (
    select 1 from unnest(fields) as f where f <> all (ignored)
  );

  -- Resolved through the table so cascaded deletes (parent already gone) log null.
  select p.id into target_pathway
    from public.pathways as p
   where p.id = case
     when tg_table_name = 'pathways' then (row_data ->> 'id')::uuid
     else (row_data ->> 'pathway_id')::uuid
   end;

  insert into public.content_changes
    (table_name, record_id, pathway_id, action, changed_fields, before, after, is_substantive, changed_by)
  values (
    tg_table_name,
    (row_data ->> 'id')::uuid,
    target_pathway,
    lower(tg_op),
    fields,
    old_row,
    new_row,
    substantive,
    auth.uid()
  );

  -- A substantive change to a published pathway's details bumps its version.
  if substantive and tg_table_name <> 'pathways' and target_pathway is not null then
    update public.pathways
       set version = version + 1
     where id = target_pathway
       and status = 'published';
  end if;

  return coalesce(new, old);
end;
$$;

-- Bumps the version when a published pathway's own visible fields change.
create or replace function public.bump_pathway_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published'
     and new.version = old.version
     and (
       new.official_name, new.name_pt, new.category, new.summary_pt,
       new.typical_duration_text, new.leads_to_residence, new.official_url,
       new.points_calculator_url
     ) is distinct from (
       old.official_name, old.name_pt, old.category, old.summary_pt,
       old.typical_duration_text, old.leads_to_residence, old.official_url,
       old.points_calculator_url
     )
  then
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;

create trigger bump_version before update on public.pathways
  for each row execute function public.bump_pathway_version();

create trigger log_change after insert or update or delete on public.pathways
  for each row execute function public.log_content_change();
create trigger log_change after insert or update or delete on public.requirements
  for each row execute function public.log_content_change();
create trigger log_change after insert or update or delete on public.pathway_steps
  for each row execute function public.log_content_change();
create trigger log_change after insert or update or delete on public.documents
  for each row execute function public.log_content_change();
create trigger log_change after insert or update or delete on public.cost_items
  for each row execute function public.log_content_change();
