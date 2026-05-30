-- Helper: generate random 4-char alphanumeric code
create or replace function generate_quiz_code() returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..4 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- 5. Admins Table (must exist before quizzes references it)
create table admins (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Quizzes Table
create table quizzes (
  id uuid default gen_random_uuid() primary key,
  code text unique default generate_quiz_code() not null,
  title text not null,
  description text,
  admin_id uuid references admins(id) on delete cascade,
  is_leaderboard_visible boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_quizzes_admin_id on quizzes(admin_id);

-- 2. Questions Table
create table questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  text text not null,
  time_limit integer default 30 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Options Table
create table options (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  text text not null,
  is_correct boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Participants Table
create table participants (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  name text not null,
  score integer default 0,
  finished_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Admins Table
create table admins (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table participants enable row level security;
alter table admins enable row level security;

-- RLS: anon role has NO access to quizzes/questions/options/admins.
-- All reads/writes go through service-role server API endpoints.
-- participants is readable by anon for the public realtime leaderboard.
create policy "anon read participants" on participants for select using (true);

-- Enable Supabase Realtime for specific tables (AFTER tables exist)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table quizzes;
alter publication supabase_realtime add table participants;
