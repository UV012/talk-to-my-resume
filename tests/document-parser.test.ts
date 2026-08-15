import { describe, it, expect } from 'vitest';
import {
  extractStructuredSections,
  parseYamlContent,
  parseDocument,
} from '@/lib/parsers/documentParser';
import { chunkSections } from '@/lib/ai/rag';

describe('Document Parser & Chunking Suite', () => {
  it('correctly parses YAML files into structured sections with line citations', () => {
    const yamlSample = `
summary: Senior AI & Distributed Systems Engineer
experience:
  - company: CloudScale
    role: Staff Engineer
    highlights: Led RAG vector pipeline processing 50M embeddings
skills:
  - TypeScript
  - Go
  - PostgreSQL
  - pgvector
projects:
  - name: Autonomous Agent Orchestrator
    stars: 1200
`;

    const result = parseYamlContent(yamlSample, 'candidate_profile.yaml');
    expect(result.sections.length).toBeGreaterThanOrEqual(3);

    const summarySection = result.sections.find((s) => s.label === 'Summary');
    expect(summarySection).toBeDefined();
    expect(summarySection?.content).toContain('Senior AI & Distributed Systems Engineer');
    expect(summarySection?.sourceCitation).toContain('candidate_profile.yaml, [summary] section');

    const skillsSection = result.sections.find((s) => s.label === 'Skills');
    expect(skillsSection).toBeDefined();
    expect(skillsSection?.content).toContain('pgvector');
  });

  it('correctly extracts structured sections from plain text / markdown resumes', () => {
    const markdownResume = `
Professional Summary
Alex Doe is a Staff Cloud Architect with extensive experience in cloud-native platforms.

Work Experience
Staff Engineer at ScaleCorp (2021 - Present)
Architected high-throughput message streaming engine in Go.

Technical Skills
Languages: Go, TypeScript, Python, Rust
Databases: PostgreSQL, Redis, Cassandra

Education
B.S. in Computer Science, University of California
`;

    const sections = extractStructuredSections(markdownResume, 'resume.md');
    expect(sections.length).toBeGreaterThanOrEqual(4);

    const experience = sections.find((s) => s.label === 'Work Experience');
    expect(experience).toBeDefined();
    expect(experience?.content).toContain('Staff Engineer at ScaleCorp');
    expect(experience?.sourceCitation).toContain('resume.md, Work Experience');
  });

  it('chunks large sections while preserving citations', () => {
    const sections = [
      {
        label: 'Work Experience',
        content: 'A'.repeat(1200), // Larger than 700 character maxChunkSize
        sourceCitation: 'resume.pdf, Work Experience',
      },
      {
        label: 'Skills',
        content: 'TypeScript, React, Next.js, Node.js, Python, PostgreSQL',
        sourceCitation: 'resume.pdf, Skills',
      },
    ];

    const chunks = chunkSections(sections, 600);
    expect(chunks.length).toBeGreaterThan(2);

    // Assert citation preserved on all chunks
    expect(chunks.every((c) => c.sourceCitation.includes('resume.pdf'))).toBe(true);
  });
});
