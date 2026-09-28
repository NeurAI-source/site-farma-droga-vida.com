-- Apply once from Supabase SQL Editor. No passwords or tokens belong here.
create table public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor')),
  active boolean not null default true
);
create function public.is_team(required_role text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.team_members where user_id = auth.uid()
    and active and (required_role is null or role = required_role));
$$;
revoke all on function public.is_team(text) from public;
grant execute on function public.is_team(text) to authenticated;
alter table public.team_members enable row level security;
create policy own_membership on public.team_members for select to authenticated using (user_id = auth.uid());
revoke all on public.team_members from anon, authenticated;
grant select on public.team_members to authenticated;
