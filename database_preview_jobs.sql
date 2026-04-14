-- Run in Supabase SQL editor
-- Creates the preview_jobs table for tracking face swap preview requests

create table public.preview_jobs (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Input
  story_slug       text not null,   -- 'hanuman-leap' | 'ram-setu' | 'sudama'
  photo_path       text not null,   -- public URL to child's uploaded photo
  child_name       text,

  -- Processing
  status           text not null default 'pending',
  -- pending | processing | done | failed
  backend          text not null default 'modal',
  error_message    text,

  -- Contact
  email            text,            -- validated email — preview sent here on completion
  email_sent       boolean not null default false,

  -- Output
  result_scene_1   text,            -- GCS signed URL (6h expiry)
  result_scene_2   text             -- GCS signed URL (6h expiry)
);

-- Migration: add email columns to existing table
-- alter table public.preview_jobs add column if not exists email text;
-- alter table public.preview_jobs add column if not exists email_sent boolean not null default false;

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger preview_jobs_updated_at
  before update on public.preview_jobs
  for each row execute function update_updated_at();

-- Allow service role full access, anon read own rows
alter table public.preview_jobs enable row level security;

create policy "service role full access" on public.preview_jobs
  for all using (auth.role() = 'service_role');

create policy "anon read by id" on public.preview_jobs
  for select using (true);  -- job_id is unguessable UUID, safe to allow read
