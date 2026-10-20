-- Milestown: tabellen en beveiliging. Plak dit in Supabase → SQL Editor en klik op Run.

-- Je stad: één rij per account, met alles erin
create table if not exists public.cities (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.cities enable row level security;
drop policy if exists "eigen stad lezen" on public.cities;
drop policy if exists "eigen stad maken" on public.cities;
drop policy if exists "eigen stad bijwerken" on public.cities;
drop policy if exists "eigen stad wissen" on public.cities;
create policy "eigen stad lezen" on public.cities for select to authenticated using (user_id = (select auth.uid()));
create policy "eigen stad maken" on public.cities for insert to authenticated with check (user_id = (select auth.uid()));
create policy "eigen stad bijwerken" on public.cities for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "eigen stad wissen" on public.cities for delete to authenticated using (user_id = (select auth.uid()));

-- Apparaten die meldingen willen ontvangen
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "eigen apparaten lezen" on public.push_subscriptions;
drop policy if exists "eigen apparaten toevoegen" on public.push_subscriptions;
drop policy if exists "eigen apparaten bijwerken" on public.push_subscriptions;
drop policy if exists "eigen apparaten wissen" on public.push_subscriptions;
create policy "eigen apparaten lezen" on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy "eigen apparaten toevoegen" on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "eigen apparaten bijwerken" on public.push_subscriptions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "eigen apparaten wissen" on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

-- Welke herinneringen al verstuurd zijn (per taak hooguit één). Alleen de server komt hierbij.
create table if not exists public.push_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, task_id)
);
alter table public.push_log enable row level security;
