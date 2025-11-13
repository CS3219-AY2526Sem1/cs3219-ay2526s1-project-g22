-- Migration: create chats table

create extension if not exists pgcrypto;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) not null,
  sender_id text not null,
  content text not null,
  role text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_chats_session_created_at on public.chats (session_id, created_at desc);
