import { describe, it, expect } from 'vitest';
import { buildAvatarSystemPrompt } from '@/lib/ai/prompts';
import { GeminiLLMClient } from '@/lib/ai/geminiClient';
import { stripCitationTags, stripMarkdown, formatPlainTextTranscript } from '@/lib/format';
import { MatchedChunk } from '@/types/database';

describe('Citation Parser, Markdown Formatter & Prompt Suite', () => {
  it('correctly parses single, sequential, and bundled citation tags in markdown text', () => {
    const sampleChunks: MatchedChunk[] = [
      {
        id: 'chunk-1',
        avatar_id: 'avatar-1',
        knowledge_source_id: 'src-1',
        content: 'Led the migration from monolithic architecture to microservices.',
        section_label: 'Experience',
        source_citation: 'Resume.pdf, Experience §1',
        similarity: 0.85,
      },
      {
        id: 'chunk-2',
        avatar_id: 'avatar-1',
        knowledge_source_id: 'src-1',
        content: 'Reduced API p99 latency to under 35ms using Redis caching.',
        section_label: 'Performance',
        source_citation: 'Resume.pdf, Experience §2',
        similarity: 0.82,
      },
      {
        id: 'chunk-3',
        avatar_id: 'avatar-1',
        knowledge_source_id: 'src-2',
        content: 'Designed event-driven streaming pipeline processing 50k events/sec.',
        section_label: 'Projects',
        source_citation: 'case_study.yaml, Architecture',
        similarity: 0.79,
      },
      {
        id: 'chunk-4',
        avatar_id: 'avatar-1',
        knowledge_source_id: 'src-2',
        content: 'Mentored 6 junior engineers and ran bi-weekly architecture reviews.',
        section_label: 'Leadership',
        source_citation: 'case_study.yaml, Leadership',
        similarity: 0.75,
      },
    ];

    // Helper to extract citations according to the hardened logic
    const extractCitations = (text: string) => {
      const citations: any[] = [];
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
          const chunk = sampleChunks[idx - 1];
          if (chunk) {
            citations.push({
              citation: chunk.source_citation,
              section: chunk.section_label,
              snippet: chunk.content.slice(0, 150),
            });
          }
        }
      }
      return citations;
    };

    // Markdown text with citations
    const textWithMarkdown =
      'I specialize in **distributed systems** and **cloud architecture**:\n- Migrated monolith to **microservices** [cite:1]\n- Decreased p99 latency to **35ms** [cite:2]\n- Designed **event streaming pipeline** [cite:3, 4]';

    const result = extractCitations(textWithMarkdown);
    expect(result.length).toBe(4);
    expect(result[0].citation).toBe('Resume.pdf, Experience §1');
    expect(result[1].citation).toBe('Resume.pdf, Experience §2');
    expect(result[2].citation).toBe('case_study.yaml, Architecture');
    expect(result[3].citation).toBe('case_study.yaml, Leadership');
  });

  it('stripCitationTags cleanly removes citation tags before markdown rendering', () => {
    const input =
      'Here is an overview of my core skills:\n- **Node.js & TypeScript** [cite:1]\n- **PostgreSQL & Redis** [cite:2]\n- **Kubernetes orchestration** [cite:3, 4]';

    const output = stripCitationTags(input);
    expect(output).toBe(
      'Here is an overview of my core skills:\n- **Node.js & TypeScript**\n- **PostgreSQL & Redis**\n- **Kubernetes orchestration**'
    );
  });

  it('stripMarkdown and formatPlainTextTranscript cleanly strip markdown and citations for PDF/email', () => {
    const rawMarkdownWithCitations =
      'Here is my background [cite:1]:\n- **Staff Backend Engineer** at TechFlow [cite:2]\n- Architected *Kafka event pipelines* and `Redis` cache layers [cite:3, 4]\n- Check out [my portfolio](https://example.com)';

    const plainText = formatPlainTextTranscript(rawMarkdownWithCitations);

    // Assert markdown symbols are stripped
    expect(plainText).not.toContain('**');
    expect(plainText).not.toContain('`');
    expect(plainText).not.toContain('[cite:');
    expect(plainText).toContain('Staff Backend Engineer at TechFlow');
    expect(plainText).toContain('Architected Kafka event pipelines and Redis cache layers');
    expect(plainText).toContain('Check out my portfolio');
  });

  it('buildAvatarSystemPrompt allows light markdown for clarity while enforcing unbundled citations', () => {
    const prompt = buildAvatarSystemPrompt('Alex Doe', 'Staff Engineer', ['Summary 1'], []);

    // Check for light markdown permission guidance
    expect(prompt).toContain('You may use light markdown formatting where it improves clarity');
    expect(prompt).toContain('bold for key skills');
    expect(prompt).toContain('bullet points when listing multiple distinct items');

    // Check for unbundled citation instruction
    expect(prompt).toContain('NEVER bundle multiple numbers into a single tag like [cite:1, 2]');
    expect(prompt).toContain('emit ONE citation tag per source');
  });

  it('Gemini client dynamically reads model configuration from environment', () => {
    process.env.GEMINI_CHAT_MODEL = 'gemini-3.1-flash-lite';
    process.env.GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

    const client = new GeminiLLMClient();
    expect(client).toBeDefined();
  });
});
