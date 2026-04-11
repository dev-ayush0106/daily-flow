-- ============================================================
-- FlowTrack – Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ── todos ────────────────────────────────────────────────────
create table if not exists todos (
  id                  text        primary key,
  user_id             uuid        not null references auth.users(id) on delete cascade,
  text                text        not null,
  category            text        not null default 'personal',
  priority            text        not null default 'medium',
  due_date            text,
  due_time            text,
  recurring           text        not null default 'none',
  completed           boolean     not null default false,
  completed_at        text,
  created_at          text        not null,
  notes               text        not null default '',
  rolled_forward_from text,
  rolled_at           text
);

alter table todos enable row level security;

create policy "Users manage own todos"
  on todos for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── todo_history ─────────────────────────────────────────────
create table if not exists todo_history (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  text         text not null,
  category     text,
  priority     text,
  due_date     text,
  due_time     text,
  recurring    text,
  completed    boolean default true,
  completed_at text,
  created_at   text,
  archived_at  text,
  notes        text
);

alter table todo_history enable row level security;

create policy "Users manage own history"
  on todo_history for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
