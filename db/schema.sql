create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  grade text not null,
  school_type text not null default 'SAPIX',
  target_schools text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  test_name text not null,
  test_date date not null,
  subject text not null,
  score numeric(6, 2),
  deviation_value numeric(5, 2),
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists wrong_questions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  subject text not null,
  source_name text not null,
  question_no text not null,
  image_url text,
  unit text,
  difficulty integer check (difficulty between 1 and 5),
  mistake_reason text,
  ai_analysis jsonb,
  review_status text not null default '未復習',
  next_review_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_children_user_id on children(user_id);
create index if not exists idx_tests_child_id_date on tests(child_id, test_date desc);
create index if not exists idx_wrong_questions_child_id_created on wrong_questions(child_id, created_at desc);
create index if not exists idx_wrong_questions_unit on wrong_questions(unit);
