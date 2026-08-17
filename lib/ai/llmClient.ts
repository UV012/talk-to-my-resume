import { MatchedChunk, CitationReference, ScorecardKeyEvidence } from '@/types/database';

export interface ChatHistoryItem {
  role: 'hr' | 'avatar';
  content: string;
}

export interface GenerateChatOptions {
  candidateName: string;
  targetRole: string | null;
  retrievedChunks: MatchedChunk[];
  history: ChatHistoryItem[];
  userMessage: string;
}

export interface ChatResponseResult {
  content: string;
  citations: CitationReference[];
}

export interface GroundingCheckResult {
  flagged: boolean;
  reason: string | null;
}

export interface ScorecardResult {
  topic_coverage: Record<string, boolean>;
  key_evidence: ScorecardKeyEvidence[];
  open_questions: string[];
}

export interface LLMClient {
  generateEmbedding(text: string): Promise<number[]>;
  generateChatResponse(options: GenerateChatOptions): Promise<ChatResponseResult>;
  verifyGrounding(question: string, answer: string, candidateChunksText: string): Promise<GroundingCheckResult>;
  generateScorecard(
    candidateName: string,
    transcriptText: string,
    allCandidateKnowledge: string,
    targetRole?: string | null
  ): Promise<ScorecardResult>;
}
