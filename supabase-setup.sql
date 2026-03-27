-- MoMA Moment: run this in your Supabase SQL Editor
-- Settings > SQL Editor > New Query

create table if not exists moments (
  id              uuid        default gen_random_uuid() primary key,
  created_at      timestamptz default now(),
  visitor_name    text        not null,
  email           text        not null,
  moment_text     text,
  image_data      text,          -- base64-encoded JPEG
  painting_name   text,
  painting_artist text
);

-- index on email for fast per-user queries
create index if not exists moments_email_idx on moments (email);

-- Row Level Security
alter table moments enable row level security;

-- anyone (anon key) can insert a new moment
create policy "allow_insert" on moments
  for insert with check (true);

-- anyone can read moments (gallery is email-gated in the frontend)
-- tighten this later with real auth if needed
create policy "allow_select" on moments
  for select using (true);
