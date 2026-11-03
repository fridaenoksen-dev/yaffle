-- Yaffle: kjør hele denne filen én gang i Supabase → SQL Editor.

-- 1) Hvem slipper inn
create table if not exists public.allowed_emails (
  email text primary key
);
alter table public.allowed_emails enable row level security;  -- ingen policyer = ingen kan lese lista fra appen

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.allowed_emails where lower(email) = lower(auth.jwt() ->> 'email'));
$$;
grant execute on function public.is_member() to authenticated;

-- 2) Alle data i appen (tur, bookinger, idéer, medlemmer) som JSON-dokumenter
create table if not exists public.docs (
  path        text primary key,          -- f.eks. "items/i03"
  collection  text not null,             -- f.eks. "items"
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
create index if not exists docs_collection_idx on public.docs (collection);
alter table public.docs enable row level security;

drop policy if exists "members read"   on public.docs;
drop policy if exists "members insert" on public.docs;
drop policy if exists "members update" on public.docs;
drop policy if exists "members delete" on public.docs;
create policy "members read"   on public.docs for select to authenticated using (public.is_member());
create policy "members insert" on public.docs for insert to authenticated with check (public.is_member());
create policy "members update" on public.docs for update to authenticated using (public.is_member()) with check (public.is_member());
create policy "members delete" on public.docs for delete to authenticated using (public.is_member());

create or replace function public.touch_docs() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before update on public.docs for each row execute function public.touch_docs();

-- Slår sammen felt (brukes til hjerter, så to stykker kan trykke samtidig)
create or replace function public.jsonb_deep_merge(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare k text; v jsonb; r jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' or b is null or jsonb_typeof(b) <> 'object' then return b; end if;
  r := a;
  for k, v in select * from jsonb_each(b) loop
    r := jsonb_set(r, array[k], public.jsonb_deep_merge(r -> k, v), true);
  end loop;
  return r;
end $$;

create or replace function public.doc_merge(p_path text, p_patch jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update public.docs set data = public.jsonb_deep_merge(data, p_patch) where path = p_path;
  if not found then raise exception 'Document % not found', p_path; end if;
end $$;
grant execute on function public.doc_merge(text, jsonb) to authenticated;

-- 3) Sanntid: endringer vises hos de andre med en gang
alter table public.docs replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- 4) Kvitteringer og bilder (privat bøtte, maks 20 MB, bilder og PDF)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 20971520, array['image/png','image/jpeg','image/webp','image/gif','application/pdf'])
on conflict (id) do nothing;

drop policy if exists "members read files"   on storage.objects;
drop policy if exists "members upload files" on storage.objects;
drop policy if exists "members delete files" on storage.objects;
create policy "members read files"   on storage.objects for select to authenticated using (bucket_id = 'receipts' and public.is_member());
create policy "members upload files" on storage.objects for insert to authenticated with check (bucket_id = 'receipts' and public.is_member());
create policy "members delete files" on storage.objects for delete to authenticated using (bucket_id = 'receipts' and public.is_member());

-- 5) Legg til gjengen (bytt ut med de ekte e-postene)
insert into public.allowed_emails (email) values
  ('frida.enoksen@gmail.com')
  -- , ('venninne1@eksempel.no')
  -- , ('venninne2@eksempel.no')
on conflict do nothing;
