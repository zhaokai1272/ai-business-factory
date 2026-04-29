-- ============================================================
-- DeepKeyword — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up tables & RLS
-- ============================================================

-- 1. USERS TABLE (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  searches_remaining integer not null default 5,
  total_searches integer not null default 0,
  subscription_id text,
  paddle_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. QUERIES TABLE (keyword research history)
create table if not exists public.queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  seed_keyword text not null,
  result_count integer not null default 0,
  keywords jsonb not null default '[]'::jsonb,
  content_brief jsonb,
  source text default 'deepseek',
  created_at timestamptz not null default now()
);

-- 3. SUBSCRIPTIONS TABLE (Paddle webhook log)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  paddle_subscription_id text unique,
  paddle_checkout_id text unique,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'trialing')),
  price_id text,
  plan text not null default 'pro',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. PAYMENT EVENTS TABLE (audit log)
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  paddle_event_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_queries_user_id on public.queries(user_id);
create index if not exists idx_queries_created_at on public.queries(created_at desc);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_paddle_id on public.subscriptions(paddle_subscription_id);
create index if not exists idx_payment_events_user_id on public.payment_events(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.queries enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Queries: users can CRUD their own queries
create policy "Users can insert own queries" on public.queries
  for insert with check (auth.uid() = user_id);

create policy "Users can read own queries" on public.queries
  for select using (auth.uid() = user_id);

create policy "Users can delete own queries" on public.queries
  for delete using (auth.uid() = user_id);

-- Subscriptions: users can read their own
create policy "Users can read own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Payment events: users can read their own
create policy "Users can read own payment events" on public.payment_events
  for select using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, plan, searches_remaining)
  values (new.id, new.email, 'free', 5);
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists to avoid conflict on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNCTION: reset monthly searches (called by cron or edge function)
-- ============================================================
create or replace function public.reset_monthly_searches()
returns void as $$
begin
  update public.profiles
  set searches_remaining = case when plan = 'pro' then 999 else 5 end,
      updated_at = now();
end;
$$ language plpgsql;
