-- Additional job titles retain team editing permissions. Only admin creates users/publishes.
begin;
alter table public.team_members drop constraint team_members_role_check;
alter table public.team_members add constraint team_members_role_check
  check (role in ('admin','editor','owner','manager'));
commit;
