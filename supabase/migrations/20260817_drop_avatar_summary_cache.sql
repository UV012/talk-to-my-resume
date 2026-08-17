-- Migration: Drop avatar_summary_cache table
-- Description: Completely remove unused 3-bullet summary cache table and cascade policies/indexes

DROP TABLE IF EXISTS public.avatar_summary_cache CASCADE;
