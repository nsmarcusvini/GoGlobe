-- Some governments set English minimums per skill (e.g. Australia "competent":
-- IELTS 6 in each component; Canada CLB 7). The profile stores the overall score
-- and the lowest of the four skill scores so both kinds of rule can be checked.

alter table public.profiles
  add column english_lowest_component numeric(5, 1)
    check (english_lowest_component is null or english_lowest_component >= 0);

alter table public.profiles
  add constraint profiles_english_component_needs_test
    check (english_lowest_component is null or english_test is not null);

grant update (english_lowest_component) on public.profiles to authenticated;
