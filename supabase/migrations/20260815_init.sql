-- =============================================================================
-- AI Candidate Avatar - Initial Database Schema & Supabase Setup
-- =============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users Table (Candidates)
-- Linked directly to Supabase Auth auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to create a public.users row automatically on candidate signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, public.users.display_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Avatars Table
CREATE TABLE IF NOT EXISTS public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'link_only', 'permissioned')),
  permissioned_emails TEXT[] DEFAULT '{}',
  target_role TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_avatars_candidate_id ON public.avatars(candidate_id);
CREATE INDEX IF NOT EXISTS idx_avatars_slug ON public.avatars(slug);

-- 4. Knowledge Sources Table
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('resume', 'supplement')),
  original_filename TEXT NOT NULL,
  parsed_status TEXT NOT NULL DEFAULT 'completed' CHECK (parsed_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_avatar_id ON public.knowledge_sources(avatar_id);

-- 5. Document Chunks Table with Vector Embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  knowledge_source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  section_label TEXT,
  source_citation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_avatar_id ON public.document_chunks(avatar_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_knowledge_source_id ON public.document_chunks(knowledge_source_id);

-- HNSW Vector Index for efficient similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
  ON public.document_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- 6. Avatar Summary Cache Table (3-bullet quick summary)
CREATE TABLE IF NOT EXISTS public.avatar_summary_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID UNIQUE NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  summary_bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_avatar_summary_cache_avatar_id ON public.avatar_summary_cache(avatar_id);

-- 7. Chat Sessions Table (Recruiter Interactions)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  recruiter_name TEXT NOT NULL,
  recruiter_email TEXT,
  recruiter_company TEXT,
  recruiter_target_role TEXT,
  started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_avatar_id ON public.chat_sessions(avatar_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_recruiter_email ON public.chat_sessions(recruiter_email);

-- 8. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('hr', 'avatar')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- 9. Scorecards Table
CREATE TABLE IF NOT EXISTS public.scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  topic_coverage JSONB NOT NULL DEFAULT '{}'::jsonb,
  key_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  open_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scorecards_session_id ON public.scorecards(session_id);

-- 10. Publish Checks Table (Adversarial Probe Results)
CREATE TABLE IF NOT EXISTS public.publish_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_id UUID NOT NULL REFERENCES public.avatars(id) ON DELETE CASCADE,
  probe_question TEXT NOT NULL,
  avatar_answer TEXT NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_publish_checks_avatar_id ON public.publish_checks(avatar_id);

-- =============================================================================
-- 11. RPC: Strictly Scoped Vector Match Function
-- =============================================================================
CREATE OR REPLACE FUNCTION match_document_chunks (
  target_avatar_id UUID,
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  avatar_id UUID,
  knowledge_source_id UUID,
  content TEXT,
  section_label TEXT,
  source_citation TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.avatar_id,
    dc.knowledge_source_id,
    dc.content,
    dc.section_label,
    dc.source_citation,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.avatar_id = target_avatar_id
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- 12. Storage Bucket Setup & Policies
-- =============================================================================
-- Create private storage bucket for resume & supplementary knowledge base files
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-files', 'knowledge-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Enable RLS on storage.objects if not already enabled
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policy: Candidates can upload files only into their own auth.uid() folder
CREATE POLICY "Candidates can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy: Candidates can read their own files
CREATE POLICY "Candidates can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'knowledge-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy: Candidates can update their own files
CREATE POLICY "Candidates can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'knowledge-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy: Candidates can delete their own files
CREATE POLICY "Candidates can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================================
-- 13. Row Level Security (RLS) Policies on Relational Tables
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_summary_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_checks ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- AVATARS POLICIES
CREATE POLICY "Candidates can view own avatars"
ON public.avatars FOR SELECT
TO authenticated
USING (auth.uid() = candidate_id);

CREATE POLICY "Public read for published or active avatars by slug"
ON public.avatars FOR SELECT
TO anon, authenticated
USING (status IN ('published', 'paused'));

CREATE POLICY "Candidates can insert own avatars"
ON public.avatars FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update own avatars"
ON public.avatars FOR UPDATE
TO authenticated
USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can delete own avatars"
ON public.avatars FOR DELETE
TO authenticated
USING (auth.uid() = candidate_id);

-- KNOWLEDGE SOURCES POLICIES
CREATE POLICY "Candidates can view own knowledge sources"
ON public.knowledge_sources FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.knowledge_sources.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

CREATE POLICY "Candidates can insert own knowledge sources"
ON public.knowledge_sources FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.knowledge_sources.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

CREATE POLICY "Candidates can delete own knowledge sources"
ON public.knowledge_sources FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.knowledge_sources.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

-- DOCUMENT CHUNKS POLICIES
CREATE POLICY "Candidates can view own document chunks"
ON public.document_chunks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.document_chunks.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

CREATE POLICY "Candidates can insert own document chunks"
ON public.document_chunks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.document_chunks.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

CREATE POLICY "Candidates can delete own document chunks"
ON public.document_chunks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.document_chunks.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

-- AVATAR SUMMARY CACHE POLICIES
CREATE POLICY "Anyone can view summary cache for active avatar"
ON public.avatar_summary_cache FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.avatar_summary_cache.avatar_id
      AND (public.avatars.candidate_id = auth.uid() OR public.avatars.status = 'published')
  )
);

CREATE POLICY "Candidates can manage own summary cache"
ON public.avatar_summary_cache FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.avatar_summary_cache.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

-- CHAT SESSIONS POLICIES
CREATE POLICY "Candidates can view chat sessions for their avatars"
ON public.chat_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.chat_sessions.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

-- CHAT MESSAGES POLICIES
CREATE POLICY "Candidates can view messages for their avatars"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions
    JOIN public.avatars ON public.avatars.id = public.chat_sessions.avatar_id
    WHERE public.chat_sessions.id = public.chat_messages.session_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

-- SCORECARDS POLICIES
CREATE POLICY "Candidates can view scorecards for their avatars"
ON public.scorecards FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions
    JOIN public.avatars ON public.avatars.id = public.chat_sessions.avatar_id
    WHERE public.chat_sessions.id = public.scorecards.session_id
      AND public.avatars.candidate_id = auth.uid()
  )
);

-- PUBLISH CHECKS POLICIES
CREATE POLICY "Candidates can view and manage publish checks for their avatars"
ON public.publish_checks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.avatars
    WHERE public.avatars.id = public.publish_checks.avatar_id
      AND public.avatars.candidate_id = auth.uid()
  )
);
