-- =============================================================================
-- Migration: Make recruiter_email optional (nullable) on chat_sessions
-- =============================================================================

ALTER TABLE public.chat_sessions ALTER COLUMN recruiter_email DROP NOT NULL;
