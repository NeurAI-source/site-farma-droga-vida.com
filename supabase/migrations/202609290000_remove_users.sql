-- Only the authenticated Edge Function may prepare account deletion.
create function public.prepare_panel_user_deletion(actor_id uuid, target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(9282026);
  if actor_id = target_id or not exists(select 1 from public.team_members where user_id = actor_id and active and role = 'admin') then
    raise exception 'Unauthorized';
  end if;
  if not exists(select 1 from public.team_members where user_id = target_id) then raise exception 'Not a panel user'; end if;
  if exists(select 1 from public.team_members where user_id = target_id and active and role = 'admin')
     and (select count(*) from public.team_members where active and role = 'admin') <= 1 then raise exception 'Last administrator'; end if;
  update public.team_members set active = false where user_id = target_id;
  update public.publications set created_by = null where created_by = target_id;
  -- Retain pharmacy images even when their uploader leaves the team.
  update storage.objects set owner = null, owner_id = null where bucket_id = 'product-images' and owner_id = target_id::text;
end;
$$;
revoke all on function public.prepare_panel_user_deletion(uuid,uuid) from public, anon, authenticated;
grant execute on function public.prepare_panel_user_deletion(uuid,uuid) to service_role;
