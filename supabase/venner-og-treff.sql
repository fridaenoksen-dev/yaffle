-- Yaffle: venner, gjenger, treff og kalenderabonnement.
-- Kjør hele fila én gang i Supabase → SQL Editor. Trygg å kjøre på nytt.
-- Treff lagres som turer med kind = 'treff', så tilgang, invitasjoner og sletting virker som før.

-- 1) Venner (hver person har sin egen venneliste, med favoritter)
create table if not exists public.friends (
  user_id    uuid not null references auth.users(id) on delete cascade,
  friend_id  uuid not null references auth.users(id) on delete cascade,
  favorite   boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friends enable row level security;   -- brukes bare via funksjonene under

-- 2) Gjenger: lagrede utvalg av venner (private for den som lager dem)
create table if not exists public.user_groups (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  members    uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.user_groups enable row level security;

-- 3) Hemmelig nøkkel per person for kalenderabonnementet
create table if not exists public.calendar_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token   text not null unique
);
alter table public.calendar_tokens enable row level security;

-- Søk etter Yaffle-brukere: navn (minst 2 tegn) eller hel e-postadresse
create or replace function public.search_users(p_q text)
returns table (id uuid, nick text, photo text, is_friend boolean)
language sql stable security definer set search_path = public as $$
  with q as (select lower(trim(coalesce(p_q, ''))) as s)
  select u.id,
         coalesce(p.data->>'nick', split_part(u.email, '@', 1)) as nick,
         p.data->>'photo' as photo,
         exists (select 1 from friends f where f.user_id = auth.uid() and f.friend_id = u.id) as is_friend
  from auth.users u
  left join docs p on p.path = 'profiles/' || u.id::text
  , q
  where auth.uid() is not null and u.id <> auth.uid() and length(q.s) >= 2
    and (lower(u.email) = q.s or (p.data->>'nick') ilike '%' || q.s || '%')
  order by (lower(u.email) = q.s) desc, nick
  limit 12;
$$;
grant execute on function public.search_users(text) to authenticated;

create or replace function public.my_friends()
returns table (id uuid, nick text, photo text, favorite boolean)
language sql stable security definer set search_path = public as $$
  select f.friend_id, coalesce(p.data->>'nick', split_part(u.email, '@', 1)), p.data->>'photo', f.favorite
  from friends f join auth.users u on u.id = f.friend_id
  left join docs p on p.path = 'profiles/' || f.friend_id::text
  where f.user_id = auth.uid()
  order by f.favorite desc, 2;
$$;
grant execute on function public.my_friends() to authenticated;

create or replace function public.add_friend(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into friends (user_id, friend_id) values (auth.uid(), p_user) on conflict do nothing;
end $$;
grant execute on function public.add_friend(uuid) to authenticated;

create or replace function public.remove_friend(p_user uuid)
returns void language sql security definer set search_path = public as $$
  delete from friends where user_id = auth.uid() and friend_id = p_user;
$$;
grant execute on function public.remove_friend(uuid) to authenticated;

create or replace function public.set_favorite(p_user uuid, p_fav boolean)
returns void language sql security definer set search_path = public as $$
  update friends set favorite = p_fav where user_id = auth.uid() and friend_id = p_user;
$$;
grant execute on function public.set_favorite(uuid, boolean) to authenticated;

-- Når noen blir med på en tur eller et treff, blir de automatisk venner med hverandre (begge veier)
create or replace function public.befriend_trip(p_trip text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_trip_member(p_trip) then raise exception 'Not a member'; end if;
  insert into friends (user_id, friend_id)
  select a.user_id, b.user_id from trip_members a join trip_members b on a.trip_id = b.trip_id and a.user_id <> b.user_id
  where a.trip_id = p_trip
  on conflict do nothing;
end $$;
grant execute on function public.befriend_trip(text) to authenticated;

-- Gjenger
create or replace function public.my_groups()
returns table (id uuid, name text, members uuid[])
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.members from user_groups g where g.owner = auth.uid() order by g.created_at;
$$;
grant execute on function public.my_groups() to authenticated;

create or replace function public.save_group(p_id uuid, p_name text, p_members uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare r uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_id is null then
    insert into user_groups (owner, name, members) values (auth.uid(), left(p_name, 40), coalesce(p_members, '{}')) returning id into r;
  else
    update user_groups set name = left(p_name, 40), members = coalesce(p_members, '{}') where id = p_id and owner = auth.uid() returning id into r;
  end if;
  return r;
end $$;
grant execute on function public.save_group(uuid, text, uuid[]) to authenticated;

create or replace function public.delete_group(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from user_groups where id = p_id and owner = auth.uid();
$$;
grant execute on function public.delete_group(uuid) to authenticated;

-- Legg venner til en tur eller et treff (bare egne venner, og bare hvis du selv er med)
create or replace function public.add_trip_members(p_trip text, p_users uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; u uuid;
begin
  if not public.is_trip_member(p_trip) then raise exception 'Not a member'; end if;
  foreach u in array coalesce(p_users, '{}') loop
    if exists (select 1 from friends where user_id = auth.uid() and friend_id = u) then
      insert into trip_members (trip_id, user_id) values (p_trip, u) on conflict do nothing;
      insert into docs (path, collection, data) values ('trips/' || p_trip || '/members/' || u, 'trips/' || p_trip || '/members',
        jsonb_build_object('joinedAt', (extract(epoch from now()) * 1000)::bigint, 'invitedBy', auth.uid()))
      on conflict (path) do nothing;
      n := n + 1;
    end if;
  end loop;
  perform public.befriend_trip(p_trip);
  return n;
end $$;
grant execute on function public.add_trip_members(text, uuid[]) to authenticated;

-- Kalenderabonnement
create or replace function public.my_calendar_token(p_reset boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_reset then delete from calendar_tokens where user_id = auth.uid(); end if;
  select token into t from calendar_tokens where user_id = auth.uid();
  if t is null then
    t := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    insert into calendar_tokens (user_id, token) values (auth.uid(), t);
  end if;
  return t;
end $$;
grant execute on function public.my_calendar_token(boolean) to authenticated;

-- Leses av /api/kalender med nøkkelen (uten innlogging). Gir bare turer og treff personen er med på og ikke har sagt nei til.
create or replace function public.calendar_feed(p_token text)
returns table (trip_id text, data jsonb, answer text)
language sql stable security definer set search_path = public as $$
  select m.trip_id, t.data, r.data->>'answer'
  from calendar_tokens c
  join trip_members m on m.user_id = c.user_id
  join docs t on t.path = 'trips/' || m.trip_id
  left join docs r on r.path = 'trips/' || m.trip_id || '/rsvp/' || c.user_id::text
  where length(coalesce(p_token, '')) >= 40 and c.token = p_token
    and coalesce(r.data->>'answer', '') <> 'no';
$$;
grant execute on function public.calendar_feed(text) to anon, authenticated;

-- Gjør alle som allerede er på tur sammen til venner
do $$ declare t text; begin
  for t in select distinct trip_id from public.trip_members loop perform public.befriend_trip(t); end loop;
end $$;
