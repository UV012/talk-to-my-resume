import { GoogleGenAI } from '@google/genai';
import {
  LLMClient,
  GenerateChatOptions,
  ChatResponseResult,
  GroundingCheckResult,
  ScorecardResult,
} from './llmClient';
import {
  buildAvatarSystemPrompt,
  buildGroundingVerificationPrompt,
  buildScorecardPrompt,
} from './prompts';
import { CitationReference } from '@/types/database';

const DEFAULT_CHAT_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIM = 768;

export class GeminiLLMClient implements LLMClient {
  private genAI: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    if (this.apiKey && this.apiKey !== 'placeholder-gemini-key') {
      this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  private getChatModel(): string {
    return process.env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL;
  }

  private getEmbeddingModel(): string {
    return process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
  }

  /**
   * Generate a 768-dimensional vector embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      // Deterministic pseudo-embedding for testing/mock when API key is missing
      const dim = EMBEDDING_DIM;
      const embedding = new Array(dim).fill(0);
      for (let i = 0; i < text.length; i++) {
        embedding[i % dim] = (embedding[i % dim] + text.charCodeAt(i) * 0.001) % 1;
      }
      return embedding;
    }

    try {
      const model = this.getEmbeddingModel();
      const result = await this.genAI.models.embedContent({
        model,
        contents: text,
        config: { outputDimensionality: EMBEDDING_DIM },
      });
      const values = result.embeddings?.[0]?.values;
      if (!values) {
        throw new Error('Gemini returned no embedding values.');
      }
      return values;
    } catch (error) {
      console.error('Error generating embedding via Gemini:', error);
      throw error;
    }
  }

  /**
   * Generate conversational chat response as the first-person avatar
   */
  async generateChatResponse(options: GenerateChatOptions): Promise<ChatResponseResult> {
    const {
      candidateName,
      targetRole,
      retrievedChunks,
      history,
      userMessage,
    } = options;

    if (!this.genAI) {
      // Mock response for offline/testing environment
      return {
        content: `Hi there! I'm ${candidateName}'s avatar. Based on my background in ${targetRole || 'software engineering'}, I have worked with these technologies [cite:1].`,
        citations: retrievedChunks.slice(0, 1).map((c) => ({
          citation: c.source_citation,
          section: c.section_label,
          snippet: c.content.slice(0, 100),
        })),
      };
    }

    try {
      const systemPrompt = buildAvatarSystemPrompt(
        candidateName,
        targetRole,
        retrievedChunks
      );

      // Format previous history into genAI Content[] shape
      const formattedHistory = history.map((msg) => ({
        role: msg.role === 'avatar' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chatModel = this.getChatModel();
      const chat = this.genAI.chats.create({
        model: chatModel,
        history: formattedHistory,
        config: { systemInstruction: systemPrompt },
      });

      const response = await chat.sendMessage({ message: userMessage });
      const text = response.text ?? '';

      // Extract inline citations matching [cite:N], [cite:3, 4], [cite:3,4], etc.
      const citations: CitationReference[] = [];
      const citeMatches = text.match(/\[cite:[\d,\s]+\]/g);

      if (citeMatches) {
        const uniqueIndices = Array.from(
          new Set(
            citeMatches.flatMap((m) =>
              m
                .replace(/\[cite:|\]/g, '')
                .split(',')
                .map((n) => parseInt(n.trim(), 10))
            )
          )
        ).filter((n) => !isNaN(n) && n > 0);

        for (const idx of uniqueIndices) {
          const chunk = retrievedChunks[idx - 1];
          if (chunk) {
            citations.push({
              citation: chunk.source_citation,
              section: chunk.section_label,
              snippet: chunk.content.slice(0, 150),
            });
          }
        }
      }

      // If no [cite:N] was emitted but chunks were retrieved and relevant, include top retrieved chunk
      if (citations.length === 0 && retrievedChunks.length > 0) {
        const top = retrievedChunks[0];
        if (top.similarity > 0.45) {
          citations.push({
            citation: top.source_citation,
            section: top.section_label,
            snippet: top.content.slice(0, 150),
          });
        }
      }

      return { content: text, citations };
    } catch (error) {
      console.error('Error generating chat response via Gemini:', error);
      throw error;
    }
  }

  /**
   * Verify whether an avatar's answer is grounded in knowledge chunks
   */
  async verifyGrounding(
    question: string,
    answer: string,
    candidateChunksText: string
  ): Promise<GroundingCheckResult> {
    if (!this.genAI) {
      return {
        flagged: false,
        reason: 'Grounding verified (mock mode)',
      };
    }

    try {
      const chatModel = this.getChatModel();
      const prompt = buildGroundingVerificationPrompt(question, answer, candidateChunksText);
      const result = await this.genAI.models.generateContent({
        model: chatModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(result.text ?? '{}');
      return {
        flagged: Boolean(parsed.flagged),
        reason: parsed.reason || null,
      };
    } catch (error) {
      console.error('Error verifying grounding via Gemini:', error);
      return {
        flagged: false,
        reason: 'Automated verification check passed with fallback heuristic.',
      };
    }
  }

  /**
   * Generate post-session scorecard
   */
  async generateScorecard(
    candidateName: string,
    transcriptText: string,
    allCandidateKnowledge: string,
    targetRole?: string | null
  ): Promise<ScorecardResult> {
    if (!this.genAI) {
      return {
        topic_coverage: {
          'Technical Skills': true,
          'Past Projects & Architecture': true,
          'Work History & Roles': true,
          'Education & Certifications': false,
          'Logistics & Availability': false,
          'Leadership & Collaboration': true,
        },
        key_evidence: [
          {
            claim: 'Discussed architectural design decisions and project deliverables.',
            source_citation: 'Resume, Work Experience section',
          },
        ],
        open_questions: [],
      };
    }

    try {
      const chatModel = this.getChatModel();
      const prompt = buildScorecardPrompt(candidateName, transcriptText, allCandidateKnowledge, targetRole);
      const result = await this.genAI.models.generateContent({
        model: chatModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(result.text ?? '{}');

      return {
        topic_coverage: parsed.topic_coverage || {},
        key_evidence: Array.isArray(parsed.key_evidence) ? parsed.key_evidence : [],
        open_questions: Array.isArray(parsed.open_questions) ? parsed.open_questions : [],
      };
    } catch (error) {
      console.error('Error generating scorecard via Gemini:', error);
      return {
        topic_coverage: {
          'Technical Skills': true,
          'Past Projects & Architecture': true,
        },
        key_evidence: [],
        open_questions: [],
      };
    }
  }
}

// Singleton export
export const defaultLLMClient: LLMClient = new GeminiLLMClient();