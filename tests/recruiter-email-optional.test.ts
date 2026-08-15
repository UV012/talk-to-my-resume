import { describe, it, expect, vi } from 'vitest';
import { generateScorecardPdf } from '@/lib/pdf';
import { EmailService } from '@/lib/email';
import { ChatSession, Avatar, Scorecard, ChatMessage } from '@/types/database';

describe('Recruiter Optional Email & Delivery Status Suite', () => {
  const mockAvatar: Avatar = {
    id: 'avatar-123',
    candidate_id: 'cand-456',
    slug: 'alex-engineer',
    status: 'published',
    visibility: 'public',
    permissioned_emails: [],
    target_role: 'Principal Backend Engineer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockScorecard: Scorecard = {
    id: 'score-789',
    session_id: 'sess-101',
    topic_coverage: {
      'Technical Architecture': true,
      'System Scalability': true,
      'Compensation / Salary': false,
    },
    key_evidence: [
      { claim: 'Led distributed database migration', source_citation: 'Resume.pdf, §2' },
    ],
    open_questions: ['Availability date for onboarding'],
    generated_at: new Date().toISOString(),
  };

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      session_id: 'sess-101',
      role: 'avatar',
      content: 'Hello Sarah! I am Alex Doe’s AI Avatar [cite:1].',
      citations: [{ citation: 'Resume.pdf, §1' }],
      created_at: new Date().toISOString(),
    },
    {
      id: 'msg-2',
      session_id: 'sess-101',
      role: 'hr',
      content: 'Can you describe your experience with high-throughput systems?',
      citations: [],
      created_at: new Date().toISOString(),
    },
    {
      id: 'msg-3',
      session_id: 'sess-101',
      role: 'avatar',
      content: 'I designed an event-driven system handling 50k events per second [cite:2].',
      citations: [{ citation: 'Resume.pdf, §2' }],
      created_at: new Date().toISOString(),
    },
  ];

  it('generates PDF cleanly when recruiter_email is null/absent', () => {
    const sessionWithoutEmail: ChatSession = {
      id: 'sess-101',
      avatar_id: 'avatar-123',
      recruiter_name: 'Sarah Jenkins',
      recruiter_email: null,
      recruiter_company: 'Acme Corp',
      recruiter_target_role: 'Lead Architect',
      started_at: new Date().toISOString(),
      message_count: 3,
      ended_at: new Date().toISOString(),
    };

    const pdfBuffer = generateScorecardPdf({
      session: sessionWithoutEmail,
      avatar: mockAvatar,
      candidateName: 'Alex Doe',
      candidateEmail: 'alex@example.com',
      scorecard: mockScorecard,
      messages: mockMessages,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it('generates PDF cleanly when recruiter_email is present', () => {
    const sessionWithEmail: ChatSession = {
      id: 'sess-101',
      avatar_id: 'avatar-123',
      recruiter_name: 'Sarah Jenkins',
      recruiter_email: 'sarah@acme.com',
      recruiter_company: 'Acme Corp',
      recruiter_target_role: 'Lead Architect',
      started_at: new Date().toISOString(),
      message_count: 3,
      ended_at: new Date().toISOString(),
    };

    const pdfBuffer = generateScorecardPdf({
      session: sessionWithEmail,
      avatar: mockAvatar,
      candidateName: 'Alex Doe',
      candidateEmail: 'alex@example.com',
      scorecard: mockScorecard,
      messages: mockMessages,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it('EmailService skips recruiter email dispatch when recruiter_email is null and returns accurate status', async () => {
    const emailService = new EmailService();

    const sessionWithoutEmail: ChatSession = {
      id: 'sess-102',
      avatar_id: 'avatar-123',
      recruiter_name: 'David Miller',
      recruiter_email: null,
      recruiter_company: null,
      recruiter_target_role: null,
      started_at: new Date().toISOString(),
      message_count: 2,
      ended_at: new Date().toISOString(),
    };

    const delivery = await emailService.sendSessionCompletionEmails({
      session: sessionWithoutEmail,
      avatar: mockAvatar,
      candidateName: 'Alex Doe',
      candidateEmail: 'alex@example.com',
      scorecard: mockScorecard,
      messages: mockMessages,
    });

    expect(delivery.recruiterEmailAttempted).toBe(false);
    expect(delivery.recruiterEmailSent).toBe(false);
    expect(delivery.candidateEmailAttempted).toBe(true);
    expect(delivery.candidateEmailSent).toBe(true);
  });
});
