-- kaustlog final schema
-- Run this in Supabase SQL Editor.

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists problems (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  problem_number text not null,
  sort_order integer not null default 0
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid references problems(id) on delete cascade,
  result text not null check (result in ('correct', 'partial', 'wrong')),
  duration_seconds integer not null default 0,
  attempted_at timestamptz not null default now()
);

alter table attempts add column if not exists book_id text;
alter table attempts add column if not exists unit_id text;
alter table attempts add column if not exists problem_number text;
alter table attempts alter column problem_id drop not null;

create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  reflection_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists daily_tasks (
  id uuid primary key default gen_random_uuid(),
  task_date date not null default current_date,
  content text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- The app calculates study time from attempts.duration_seconds.
-- study_sessions can remain unused if it already exists.
