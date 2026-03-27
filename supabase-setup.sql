-- MoMA Moment: run this in your Supabase SQL Editor
-- Settings > SQL Editor > New Query

-- ── moments table ────────────────────────────────────────────────────────────
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

create index if not exists moments_email_idx on moments (email);

alter table moments enable row level security;

create policy "allow_insert" on moments
  for insert with check (true);

create policy "allow_select" on moments
  for select using (true);


-- ── draft_moments table (QR / phone flow) ────────────────────────────────────
-- Stores image + painting info temporarily until the user completes
-- the form on their phone. Completed drafts are moved to moments and deleted.
create table if not exists draft_moments (
  token           uuid        default gen_random_uuid() primary key,
  created_at      timestamptz default now(),
  image_data      text        not null,
  painting_name   text,
  painting_artist text
);

alter table draft_moments enable row level security;

-- kiosk can insert drafts
create policy "allow_insert_draft" on draft_moments
  for insert with check (true);

-- phone can read a draft by token (frontend filters by token)
create policy "allow_select_draft" on draft_moments
  for select using (true);

-- phone can delete the draft after completing it
create policy "allow_delete_draft" on draft_moments
  for delete using (true);
