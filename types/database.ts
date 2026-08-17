export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AvatarStatus = 'draft' | 'published' | 'paused';
export type AvatarVisibility = 'public' | 'link_only' | 'permissioned';
export type KnowledgeFileType = 'resume' | 'supplement';
export type ParsedStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ChatRole = 'hr' | 'avatar';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface Avatar {
  id: string;
  candidate_id: string;
  slug: string;
  status: AvatarStatus;
  visibility: AvatarVisibility;
  permissioned_emails: string[];
  target_role: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSource {
  id: string;
  avatar_id: string;
  file_url: string;
  file_type: KnowledgeFileType;
  original_filename: string;
  parsed_status: ParsedStatus;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  avatar_id: string;
  knowledge_source_id: string;
  content: string;
  embedding?: number[] | null;
  section_label: string | null;
  source_citation: string;
  created_at: string;
}

export interface MatchedChunk {
  id: string;
  avatar_id: string;
  knowledge_source_id: string;
  content: string;
  section_label: string | null;
  source_citation: string;
  similarity: number;
}

export interface ChatSession {
  id: string;
  avatar_id: string;
  recruiter_name: string;
  recruiter_email: string | null;
  recruiter_company: string | null;
  recruiter_target_role: string | null;
  started_at: string;
  message_count: number;
  ended_at: string | null;
}

export interface CitationReference {
  citation: string;
  section?: string | null;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  citations: CitationReference[];
  created_at: string;
}

export interface ScorecardKeyEvidence {
  claim: string;
  source_citation: string;
}

export interface Scorecard {
  id: string;
  session_id: string;
  topic_coverage: Record<string, boolean>;
  key_evidence: ScorecardKeyEvidence[];
  open_questions: string[];
  generated_at: string;
}

export interface PublishCheck {
  id: string;
  avatar_id: string;
  probe_question: string;
  avatar_answer: string;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}
