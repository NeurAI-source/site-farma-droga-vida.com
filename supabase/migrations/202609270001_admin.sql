-- Apply after 202609270000_team.sql
create table public.catalog_draft (
  id integer primary key check (id = 1),
  catalog jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  catalog jsonb not null,
  draft_version bigint not null,
  status text not null default 'pending' check (status in ('pending','building','published','failed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
-- Prevent competing deployments. A stale job must be resolved before retrying.
create unique index single_pending_publication on public.publications ((true)) where status in ('pending','building');
alter table public.catalog_draft enable row level security;
alter table public.publications enable row level security;
create policy read_draft on public.catalog_draft for select to authenticated using (public.is_team());
create policy read_publications on public.publications for select to authenticated using (public.is_team());
revoke all on public.catalog_draft, public.publications from anon, authenticated;
grant select on public.catalog_draft, public.publications to authenticated;

create function public.save_catalog(payload jsonb, expected_version bigint) returns bigint
language plpgsql security definer set search_path = '' as $$
declare next_version bigint;
begin
  if not public.is_team() then raise exception 'Unauthorized'; end if;
  if jsonb_typeof(payload->'products') is distinct from 'array' or jsonb_typeof(payload->'categories') is distinct from 'array'
    or octet_length(payload::text) > 2000000 then raise exception 'Invalid catalog'; end if;
  update public.catalog_draft set catalog = payload, version = version + 1, updated_at = now()
    where id = 1 and version = expected_version returning version into next_version;
  if next_version is null then raise exception 'Conflict: reload catalog'; end if;
  return next_version;
end $$;
revoke all on function public.save_catalog(jsonb,bigint) from public;
grant execute on function public.save_catalog(jsonb,bigint) to authenticated;

create table public.site_visits (
  day date not null default (now() at time zone 'America/Sao_Paulo')::date,
  session_id uuid not null,
  views integer not null default 1,
  last_view timestamptz not null default now(),
  primary key(day, session_id)
);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;
create function public.record_view(visitor uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.site_visits(session_id) values(visitor)
  on conflict(day, session_id) do update set views = public.site_visits.views + 1, last_view = now()
    where public.site_visits.last_view < now() - interval '30 seconds' and public.site_visits.views < 500;
end $$;
revoke all on function public.record_view(uuid) from public;
grant execute on function public.record_view(uuid) to service_role;
create function public.traffic_summary() returns table(day date, views bigint, visits bigint)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_team() then raise exception 'Unauthorized'; end if;
  return query select v.day, sum(v.views)::bigint, count(*) from public.site_visits v
    where v.day >= current_date - 29 group by v.day order by v.day desc;
end $$;
revoke all on function public.traffic_summary() from public;
grant execute on function public.traffic_summary() to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy upload_product_image on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_team()
    and (storage.foldername(name))[1] = auth.uid()::text);
-- No overwrite/delete: published snapshots can keep referencing previous images.
