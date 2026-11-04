-- Yaffle: flere turer med invitasjonslenker.
-- Kjør hele fila én gang i Supabase → SQL Editor. Den er trygg å kjøre på nytt.
-- Gdańsk-turen flyttes inn som turen "gdansk-2026", og alle som var med, blir med videre.

-- 1) Hvem er med på hvilken tur
create table if not exists public.trip_members (
  trip_id   text not null,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member',   -- 'owner' eller 'member'
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
alter table public.trip_members enable row level security;  -- leses bare via funksjonene under

create table if not exists public.trip_invites (
  code       text primary key,
  trip_id    text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.trip_invites enable row level security;

create or replace function public.is_trip_member(p_trip text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trip_members where trip_id = p_trip and user_id = auth.uid());
$$;
grant execute on function public.is_trip_member(text) to authenticated;

create or replace function public.doc_trip(p_path text)
returns text language sql immutable as $$
  select case when p_path like 'trips/%' then split_part(p_path, '/', 2) end;
$$;

-- 2) Flytt Gdańsk-turen inn under trips/gdansk-2026
do $$
declare t text := 'gdansk-2026';
begin
  if exists (select 1 from public.docs where path = 'trip/main') then
    -- medlemmer: fra allowed_emails og fra members-dokumentene
    insert into public.trip_members (trip_id, user_id, role)
      select t, u.id, case when lower(u.email) = 'frida.enoksen@gmail.com' then 'owner' else 'member' end
      from auth.users u
      where lower(u.email) in (select lower(email) from public.allowed_emails)
         or u.id::text in (select split_part(path, '/', 2) from public.docs where collection = 'members')
    on conflict do nothing;

    -- profiler (navn og bilde) blir felles for alle turer
    insert into public.docs (path, collection, data)
      select 'profiles/' || split_part(path, '/', 2), 'profiles',
             jsonb_strip_nulls(jsonb_build_object('nick', data->'nick', 'photo', data->'photo'))
      from public.docs where collection = 'members'
    on conflict (path) do nothing;

    -- selve turen
    insert into public.docs (path, collection, data)
      select 'trips/' || t, 'trips', data || jsonb_build_object('createdAt', 1)
      from public.docs where path = 'trip/main'
    on conflict (path) do nothing;
    delete from public.docs where path = 'trip/main';

    -- alt det andre
    update public.docs
       set path = 'trips/' || t || '/' || path,
           collection = 'trips/' || t || '/' || collection
     where collection in ('items', 'ideas', 'members', 'packing', 'personal');
  end if;
end $$;

-- 3) Nye tilgangsregler: man ser bare turer man er med på
drop policy if exists "members read"   on public.docs;
drop policy if exists "members insert" on public.docs;
drop policy if exists "members update" on public.docs;
drop policy if exists "members delete" on public.docs;
drop policy if exists "trip read"      on public.docs;
drop policy if exists "trip insert"    on public.docs;
drop policy if exists "trip update"    on public.docs;
drop policy if exists "trip delete"    on public.docs;

create policy "trip read" on public.docs for select to authenticated using (
  collection = 'profiles'
  or (public.doc_trip(path) is not null and public.is_trip_member(public.doc_trip(path)))
);
create policy "trip insert" on public.docs for insert to authenticated with check (
  path = 'profiles/' || auth.uid()::text
  or (public.doc_trip(path) is not null and path <> 'trips/' || public.doc_trip(path) and public.is_trip_member(public.doc_trip(path)))
);
create policy "trip update" on public.docs for update to authenticated
  using (path = 'profiles/' || auth.uid()::text or (public.doc_trip(path) is not null and public.is_trip_member(public.doc_trip(path))))
  with check (path = 'profiles/' || auth.uid()::text or (public.doc_trip(path) is not null and public.is_trip_member(public.doc_trip(path))));
create policy "trip delete" on public.docs for delete to authenticated using (
  public.doc_trip(path) is not null and path <> 'trips/' || public.doc_trip(path) and public.is_trip_member(public.doc_trip(path))
);

-- 4) Lag tur, inviter, bli med
create or replace function public.create_trip(p_title text, p_note text, p_start text, p_end text)
returns text language plpgsql security definer set search_path = public as $$
declare t text; base text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  base := lower(regexp_replace(translate(coalesce(nullif(p_title, ''), 'tur'), 'æøåäöüńśćźżłęąó', 'aoaaounsczzleao'), '[^a-zA-Z0-9]+', '-', 'g'));
  base := trim(both '-' from left(base, 24));
  t := coalesce(nullif(base, ''), 'tur') || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
  insert into trip_members (trip_id, user_id, role) values (t, auth.uid(), 'owner');
  insert into docs (path, collection, data) values ('trips/' || t, 'trips',
    jsonb_build_object('title', p_title, 'note', coalesce(p_note, ''), 'start', coalesce(p_start, ''), 'end', coalesce(p_end, ''),
                       'createdBy', auth.uid(), 'createdAt', (extract(epoch from now()) * 1000)::bigint));
  insert into docs (path, collection, data) values ('trips/' || t || '/members/' || auth.uid(), 'trips/' || t || '/members',
    jsonb_build_object('joinedAt', (extract(epoch from now()) * 1000)::bigint, 'role', 'owner'));
  return t;
end $$;
grant execute on function public.create_trip(text, text, text, text) to authenticated;

create or replace function public.update_trip(p_trip text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_trip_member(p_trip) then raise exception 'Not a member'; end if;
  update docs set data = data || (p_data - 'createdBy' - 'createdAt') where path = 'trips/' || p_trip;
end $$;
grant execute on function public.update_trip(text, jsonb) to authenticated;

create or replace function public.create_invite(p_trip text)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.is_trip_member(p_trip) then raise exception 'Not a member'; end if;
  select code into c from trip_invites where trip_id = p_trip order by created_at desc limit 1;
  if c is null then
    c := substr(md5(random()::text || clock_timestamp()::text || p_trip), 1, 10);
    insert into trip_invites (code, trip_id, created_by) values (c, p_trip, auth.uid());
  end if;
  return c;
end $$;
grant execute on function public.create_invite(text) to authenticated;

create or replace function public.reset_invite(p_trip text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_trip_member(p_trip) then raise exception 'Not a member'; end if;
  delete from trip_invites where trip_id = p_trip;
  return public.create_invite(p_trip);
end $$;
grant execute on function public.reset_invite(text) to authenticated;

create or replace function public.accept_invite(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select trip_id into t from trip_invites where code = p_code;
  if t is null then return null; end if;
  insert into trip_members (trip_id, user_id) values (t, auth.uid()) on conflict do nothing;
  insert into docs (path, collection, data) values ('trips/' || t || '/members/' || auth.uid(), 'trips/' || t || '/members',
    jsonb_build_object('joinedAt', (extract(epoch from now()) * 1000)::bigint))
  on conflict (path) do nothing;
  return t;
end $$;
grant execute on function public.accept_invite(text) to authenticated;

create or replace function public.leave_trip(p_trip text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from docs where path = 'trips/' || p_trip || '/members/' || auth.uid();
  delete from trip_members where trip_id = p_trip and user_id = auth.uid();
end $$;
grant execute on function public.leave_trip(text) to authenticated;

-- 5) Filer: kvitteringer per tur, profilbilder per person
drop policy if exists "members read files"   on storage.objects;
drop policy if exists "members upload files" on storage.objects;
drop policy if exists "members delete files" on storage.objects;
drop policy if exists "trip read files"      on storage.objects;
drop policy if exists "trip upload files"    on storage.objects;
drop policy if exists "trip delete files"    on storage.objects;

create policy "trip read files" on storage.objects for select to authenticated using (
  bucket_id = 'receipts' and (
    split_part(name, '/', 1) = 'profiles'
    or public.is_trip_member(split_part(name, '/', 1))
    or (position('/' in name) = 0 and public.is_trip_member('gdansk-2026'))   -- filer fra før flyttingen
  )
);
create policy "trip upload files" on storage.objects for insert to authenticated with check (
  bucket_id = 'receipts' and (
    (split_part(name, '/', 1) = 'profiles' and split_part(name, '/', 2) = auth.uid()::text)
    or public.is_trip_member(split_part(name, '/', 1))
  )
);
create policy "trip delete files" on storage.objects for delete to authenticated using (
  bucket_id = 'receipts' and (
    (split_part(name, '/', 1) = 'profiles' and split_part(name, '/', 2) = auth.uid()::text)
    or public.is_trip_member(split_part(name, '/', 1))
    or (position('/' in name) = 0 and public.is_trip_member('gdansk-2026'))
  )
);
