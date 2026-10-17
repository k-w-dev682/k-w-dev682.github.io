-- StudyLab v4 — synchronizacja bez hasel w repozytorium.
-- Uruchom w Supabase Dashboard -> SQL Editor, tylko w swoim projekcie.
-- Uzytkownik widzi i modyfikuje WYLACZNIE swoje migawki urzadzen.
create table if not exists public.study_sync_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id),
  constraint study_sync_payload_size check (octet_length(payload::text) <= 2500000),
  constraint study_sync_payload_format check (jsonb_typeof(payload) = 'object')
);

alter table public.study_sync_devices enable row level security;
revoke all on public.study_sync_devices from anon, authenticated;
grant select, insert, update, delete on public.study_sync_devices to authenticated;

drop policy if exists study_sync_select_own on public.study_sync_devices;
create policy study_sync_select_own on public.study_sync_devices
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists study_sync_insert_own on public.study_sync_devices;
create policy study_sync_insert_own on public.study_sync_devices
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists study_sync_update_own on public.study_sync_devices;
create policy study_sync_update_own on public.study_sync_devices
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists study_sync_delete_own on public.study_sync_devices;
create policy study_sync_delete_own on public.study_sync_devices
  for delete to authenticated using ((select auth.uid()) = user_id);

comment on table public.study_sync_devices is 'StudyLab: migawki wynikow oddzielne dla kazdej przegladarki, chronione RLS';
