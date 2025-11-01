-- Migration: add soft delete support to chats table

ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Add index for better query performance when filtering non-deleted messages
CREATE INDEX IF NOT EXISTS idx_chats_deleted_at ON public.chats (deleted_at) WHERE deleted_at IS NULL;
