-- Deal Cockpit — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- ─────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- connections
-- Stores per-user OAuth tokens (Google + HubSpot)
-- ─────────────────────────────────────────
create table if not exists connections (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  provider         text not null check (provider in ('google', 'hubspot')),
  access_token     text not null,
  refresh_token    text,
  expires_at       timestamptz,
  hubspot_owner_id text,              -- populated on HubSpot connect
  scopes           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, provider)
);

-- ─────────────────────────────────────────
-- runs
-- One row per weekly job execution
-- ─────────────────────────────────────────
create table if not exists runs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running' check (status in ('running', 'completed', 'failed')),
  error        text
);

-- ─────────────────────────────────────────
-- deal_snapshots
-- Point-in-time state of each deal, with scoring flags
-- ─────────────────────────────────────────
create table if not exists deal_snapshots (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  run_id                uuid not null references runs(id) on delete cascade,
  hubspot_deal_id       text not null,
  name                  text not null,
  stage                 text,
  amount                numeric,
  close_date            date,
  last_activity_at      timestamptz,   -- from HubSpot
  last_email_at         timestamptz,   -- from Gmail (real last touch)
  last_email_direction  text check (last_email_direction in ('inbound', 'outbound')),
  contact_count         int default 0,
  flags                 jsonb default '{}',  -- { days_silent, proposal_silence, no_next_step, close_date_past, single_threaded }
  state                 text check (state in ('healthy', 'stalling', 'chase_now', 'likely_dead')),
  created_at            timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- reports
-- Weekly report per user per run
-- ─────────────────────────────────────────
create table if not exists reports (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  run_id         uuid not null references runs(id) on delete cascade,
  generated_at   timestamptz not null default now(),
  summary        text,
  actions        jsonb default '[]',  -- ranked actions from LLM
  html           text,
  sent_at        timestamptz
);

-- ─────────────────────────────────────────
-- sends
-- Log of every nudge email sent (or attempted)
-- ─────────────────────────────────────────
create table if not exists sends (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  run_id            uuid not null references runs(id) on delete cascade,
  hubspot_deal_id   text not null,
  to_email          text not null,
  subject           text not null,
  body              text not null,
  gmail_thread_id   text,             -- null = new thread
  status            text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error             text,
  sent_at           timestamptz,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- user_settings
-- Per-user config: report schedule, auto-send toggle
-- ─────────────────────────────────────────
create table if not exists user_settings (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  auto_send        boolean not null default true,
  dry_run          boolean not null default true,   -- flip to false after first manual review
  report_day       int not null default 1,          -- 1 = Monday
  report_hour      int not null default 10,         -- 10:00 Lisbon
  report_email     text,                            -- defaults to auth email
  updated_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────
alter table connections    enable row level security;
alter table runs           enable row level security;
alter table deal_snapshots enable row level security;
alter table reports        enable row level security;
alter table sends          enable row level security;
alter table user_settings  enable row level security;

-- Each user can only see and modify their own rows
create policy "own rows" on connections    for all using (auth.uid() = user_id);
create policy "own rows" on runs           for all using (auth.uid() = user_id);
create policy "own rows" on deal_snapshots for all using (auth.uid() = user_id);
create policy "own rows" on reports        for all using (auth.uid() = user_id);
create policy "own rows" on sends          for all using (auth.uid() = user_id);
create policy "own rows" on user_settings  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
create index on connections    (user_id, provider);
create index on runs           (user_id, started_at desc);
create index on deal_snapshots (user_id, run_id);
create index on deal_snapshots (hubspot_deal_id);
create index on reports        (user_id, generated_at desc);
create index on sends          (user_id, run_id);
create index on sends          (status);

-- ─────────────────────────────────────────
-- Auto-insert user_settings on first login
-- ─────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_settings (user_id, report_email)
  values (new.id, new.email)
  on conflict do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
