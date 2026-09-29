-- Next Lap — Supabase schema
-- Run this once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$ begin
  create type public.experience_status as enum ('Ideia','Planejado','Agendado','Vivido','Pausado','Arquivado');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id text primary key check (id in ('E','J')),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  bio text not null default '',
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  created_by text not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text references public.profiles(id),
  want_level smallint not null default 3 check (want_level between 1 and 5),
  importance smallint not null default 2 check (importance between 1 and 3),
  cost_min numeric(10,2),
  cost_max numeric(10,2),
  duration text,
  location text,
  external_url text,
  reason text,
  status public.experience_status not null default 'Ideia',
  planned_date date,
  scheduled_date date,
  notes text,
  image_url text,
  last_viewed_at timestamptz
);

create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  completed_at timestamptz not null default now(),
  completed_by text not null references public.profiles(id),
  rating smallint check (rating between 1 and 5),
  comment text,
  memory text
);

create table if not exists public.app_settings (
  id boolean primary key default true check (id = true),
  cover_url text not null default '',
  cover_color text not null default '',
  splash_cover_url text not null default '',
  splash_color text not null default '#eaf0ff',
  updated_at timestamptz not null default now(),
  updated_by text references public.profiles(id)
);

insert into public.profiles (id, name, bio)
values
  ('E','Evy','Quero fazer algo diferente.'),
  ('J','JP','Qualquer lugar com comida boa.')
on conflict (id) do nothing;

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

create index if not exists experiences_status_idx on public.experiences(status);
create index if not exists experiences_category_idx on public.experiences(category);
create index if not exists experiences_created_at_idx on public.experiences(created_at desc);
create index if not exists completions_experience_idx on public.completions(experience_id, completed_at desc);

create or replace function public.touch_experiences_updated_at()
returns trigger
language plpgsql
as $$ begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists experiences_touch_updated_at on public.experiences;
create trigger experiences_touch_updated_at
before update on public.experiences
for each row execute function public.touch_experiences_updated_at();

create or replace function public.current_profile_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_profile_code() to authenticated;

alter table public.profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.completions enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
on public.profiles for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update to authenticated
using (id = public.current_profile_code())
with check (id = public.current_profile_code());

drop policy if exists experiences_select_authenticated on public.experiences;
create policy experiences_select_authenticated
on public.experiences for select to authenticated using (true);

drop policy if exists experiences_insert_authenticated on public.experiences;
create policy experiences_insert_authenticated
on public.experiences for insert to authenticated
with check (created_by = public.current_profile_code());

drop policy if exists experiences_update_authenticated on public.experiences;
create policy experiences_update_authenticated
on public.experiences for update to authenticated
using (true)
with check (updated_by = public.current_profile_code() or updated_by is null);

drop policy if exists experiences_delete_authenticated on public.experiences;
create policy experiences_delete_authenticated
on public.experiences for delete to authenticated
using (true);

drop policy if exists completions_select_authenticated on public.completions;
create policy completions_select_authenticated
on public.completions for select to authenticated using (true);

drop policy if exists completions_insert_authenticated on public.completions;
create policy completions_insert_authenticated
on public.completions for insert to authenticated
with check (completed_by = public.current_profile_code());

drop policy if exists completions_update_own on public.completions;
create policy completions_update_own
on public.completions for update to authenticated
using (completed_by = public.current_profile_code())
with check (completed_by = public.current_profile_code());

drop policy if exists completions_delete_own on public.completions;
create policy completions_delete_own
on public.completions for delete to authenticated
using (completed_by = public.current_profile_code());

drop policy if exists settings_select_authenticated on public.app_settings;
create policy settings_select_authenticated
on public.app_settings for select to authenticated using (true);

drop policy if exists settings_insert_authenticated on public.app_settings;
create policy settings_insert_authenticated
on public.app_settings for insert to authenticated
with check (updated_by = public.current_profile_code() or updated_by is null);

drop policy if exists settings_update_authenticated on public.app_settings;
create policy settings_update_authenticated
on public.app_settings for update to authenticated
using (true)
with check (updated_by = public.current_profile_code() or updated_by is null);

-- Storage buckets. Policies are intentionally scoped to signed-in users.
insert into storage.buckets (id, name, public)
values
  ('avatars','avatars',true),
  ('experiences','experiences',true),
  ('backgrounds','backgrounds',true)
on conflict (id) do update set public = excluded.public;

drop policy if exists storage_read_next_lap on storage.objects;
create policy storage_read_next_lap
on storage.objects for select to public
using (bucket_id in ('avatars','experiences','backgrounds'));

drop policy if exists storage_insert_next_lap on storage.objects;
create policy storage_insert_next_lap
on storage.objects for insert to authenticated
with check (bucket_id in ('avatars','experiences','backgrounds'));

drop policy if exists storage_update_next_lap on storage.objects;
create policy storage_update_next_lap
on storage.objects for update to authenticated
using (bucket_id in ('avatars','experiences','backgrounds'))
with check (bucket_id in ('avatars','experiences','backgrounds'));

drop policy if exists storage_delete_next_lap on storage.objects;
create policy storage_delete_next_lap
on storage.objects for delete to authenticated
using (bucket_id in ('avatars','experiences','backgrounds'));

-- Realtime: add the shared tables to Supabase's default realtime publication when available.
do $$
begin
  if to_regclass('public.experiences') is not null and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'experiences'
  ) then alter publication supabase_realtime add table public.experiences; end if;
  if to_regclass('public.profiles') is not null and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then alter publication supabase_realtime add table public.profiles; end if;
  if to_regclass('public.completions') is not null and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'completions'
  ) then alter publication supabase_realtime add table public.completions; end if;
  if to_regclass('public.app_settings') is not null and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings'
  ) then alter publication supabase_realtime add table public.app_settings; end if;
exception when undefined_object then
  -- Some Supabase projects may not expose the publication in the SQL editor.
  null;
end $$;
