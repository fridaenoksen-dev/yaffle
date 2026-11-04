-- Yaffle: slette en tur. Kjør hele fila én gang i Supabase → SQL Editor. Trygg å kjøre på nytt.
-- Bare den som lagde turen (role = 'owner') kan slette den. Andre kan forlate turen.

create or replace function public.is_trip_owner(p_trip text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = p_trip and user_id = auth.uid() and role = 'owner');
$$;
grant execute on function public.is_trip_owner(text) to authenticated;

create or replace function public.delete_trip(p_trip text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_trip_owner(p_trip) then raise exception 'Not owner'; end if;
  delete from docs where path = 'trips/' || p_trip or path like 'trips/' || p_trip || '/%';
  delete from trip_invites where trip_id = p_trip;
  delete from trip_members where trip_id = p_trip;
end $$;
grant execute on function public.delete_trip(text) to authenticated;
