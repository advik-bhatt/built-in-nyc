-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists profiles (
  id text primary key,
  username text unique,
  email text,
  country text,
  created_at timestamptz default now()
);

create table if not exists designs (
  id uuid primary key default gen_random_uuid(),
  user_id text references profiles(id),
  prompt text not null,
  title text,
  openscad_code text not null,
  explanation text,
  complexity_score integer default 5,
  preview_json jsonb,
  is_public boolean default true,
  fork_of uuid references designs(id),
  created_at timestamptz default now()
);

create index if not exists idx_designs_user_id on designs(user_id);
create index if not exists idx_designs_is_public on designs(is_public);
create index if not exists idx_profiles_country on profiles(country);

-- Enable RLS
alter table profiles enable row level security;
alter table designs enable row level security;

-- Public read on public designs
create policy "Public designs are viewable by everyone"
  on designs for select
  using (is_public = true);

-- Users can view their own private designs
create policy "Users can view own designs"
  on designs for select
  using (auth.uid()::text = user_id);

-- Service role bypasses RLS (used in API routes with service key)
