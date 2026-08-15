import { Resend } from 'resend';
import { Scorecard, ChatMessage, ChatSession, Avatar } from '@/types/database';
import { formatPlainTextTranscript } from '@/lib/format';

export interface SendSessionCompletionEmailOptions {
  session: ChatSession;
  avatar: Avatar;
  candidateName: string;
  candidateEmail: string;
  scorecard: Scorecard;
  messages: ChatMessage[];
  pdfBuffer?: Buffer;
}

export interface EmailDeliveryResult {
  recruiterEmailAttempted: boolean;
  recruiterEmailSent: boolean;
  recruiterEmailError?: string | null;
  candidateEmailAttempted: boolean;
  candidateEmailSent: boolean;
  candidateEmailError?: string | null;
}

export class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    if (apiKey && apiKey !== 'placeholder' && apiKey.startsWith('re_')) {
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Format styled HTML email template for scorecard and interview summary
   */
  private generateHtmlEmail(
    recipientType: 'candidate' | 'recruiter',
    candidateName: string,
    recruiterName: string,
    recruiterEmail: string | null,
    recruiterCompany: string | null,
    recruiterTargetRole: string | null,
    candidateRole: string | null,
    scorecard: Scorecard,
    messages: ChatMessage[]
  ): string {
    const isCandidate = recipientType === 'candidate';
    const roleText = candidateRole ? ` (${candidateRole})` : '';
    const emailDisplay = recruiterEmail ? ` (${recruiterEmail}${recruiterCompany ? `, ${recruiterCompany}` : ''})` : recruiterCompany ? ` (${recruiterCompany})` : '';
    const inquiryRoleText = recruiterTargetRole ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Target Role under Consideration:</strong> ${recruiterTargetRole}</p>` : '';

    const topicCoverageHtml = Object.entries(scorecard.topic_coverage)
      .map(([topic, covered]) => {
        const badgeColor = covered ? '#10b981' : '#6b7280';
        const statusText = covered ? 'Covered' : 'Not Discussed';
        return `
          <div style="display: inline-block; margin: 4px; padding: 6px 12px; background: #f3f4f6; border-radius: 16px; font-size: 13px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${badgeColor}; margin-right: 6px;"></span>
            <strong>${topic}:</strong> ${statusText}
          </div>
        `;
      })
      .join('');

    const keyEvidenceHtml =
      scorecard.key_evidence.length > 0
        ? scorecard.key_evidence
            .map(
              (ev) => `
          <li style="margin-bottom: 8px;">
            <strong>${ev.claim}</strong><br/>
            <span style="font-size: 12px; color: #6b7280;">Source: ${ev.source_citation}</span>
          </li>
        `
            )
            .join('')
        : '<li style="color: #6b7280;">No direct factual claims cited.</li>';

    const openQuestionsHtml =
      scorecard.open_questions.length > 0
        ? scorecard.open_questions
            .map((q) => `<li style="margin-bottom: 6px; color: #374151;">${q}</li>`)
            .join('')
        : '<li style="color: #6b7280;">None (all topics fell within the candidate knowledge base).</li>';

    const transcriptExcerpt = messages
      .slice(0, 8)
      .map((m) => {
        const sender = m.role === 'avatar' ? `${candidateName}'s Avatar` : recruiterName;
        const bg = m.role === 'avatar' ? '#f0fdf4' : '#f8fafc';
        return `
          <div style="background: ${bg}; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
            <div style="font-weight: 600; font-size: 12px; color: #4b5563; margin-bottom: 4px;">${sender}</div>
            <div style="font-size: 14px; color: #1f2937;">${formatPlainTextTranscript(m.content)}</div>
          </div>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
            .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
            .content { padding: 24px; }
            .section { margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 20px; }
            .section:last-child { border-bottom: none; }
            .h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">AI Candidate Avatar Interview Brief</h1>
              <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.85;">
                ${isCandidate ? `A recruiter just interviewed your avatar` : `Interview Record with ${candidateName}${roleText}`}
              </p>
            </div>
            <div class="content">
              <div class="section">
                <h2 class="h2">Participant Information</h2>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Candidate:</strong> ${candidateName}${roleText}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Recruiter:</strong> ${recruiterName}${emailDisplay}</p>
                ${inquiryRoleText}
                <p style="margin: 4px 0; font-size: 14px;"><strong>Total Messages Exchanged:</strong> ${messages.length}</p>
              </div>

              <div class="section">
                <h2 class="h2">Topic Coverage</h2>
                <div>${topicCoverageHtml}</div>
              </div>

              <div class="section">
                <h2 class="h2">Key Evidence & Grounded Claims</h2>
                <ul style="padding-left: 20px; margin: 0; font-size: 14px;">
                  ${keyEvidenceHtml}
                </ul>
              </div>

              <div class="section">
                <h2 class="h2">Open / Unlisted Questions</h2>
                <ul style="padding-left: 20px; margin: 0; font-size: 14px;">
                  ${openQuestionsHtml}
                </ul>
              </div>

              <div class="section">
                <h2 class="h2">Transcript Excerpt</h2>
                <div>${transcriptExcerpt}</div>
                ${messages.length > 8 ? '<p style="font-size: 12px; color: #6b7280; text-align: center;">(Full transcript attached as PDF)</p>' : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Dispatch emails to both recruiter (if email provided) and candidate
   */
  async sendSessionCompletionEmails(options: SendSessionCompletionEmailOptions): Promise<EmailDeliveryResult> {
    const { session, avatar, candidateName, candidateEmail, scorecard, messages, pdfBuffer } = options;

    const result: EmailDeliveryResult = {
      recruiterEmailAttempted: false,
      recruiterEmailSent: false,
      recruiterEmailError: null,
      candidateEmailAttempted: false,
      candidateEmailSent: false,
      candidateEmailError: null,
    };

    const attachments = pdfBuffer
      ? [
          {
            filename: `Interview_Scorecard_${candidateName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
          },
        ]
      : undefined;

    // Check if offline / mock mode
    if (!this.resend) {
      if (session.recruiter_email) {
        result.recruiterEmailAttempted = true;
        result.recruiterEmailSent = true;
        console.log(`[Resend Mock] Dispatched interview brief to recruiter: ${session.recruiter_email}`);
      }
      if (candidateEmail) {
        result.candidateEmailAttempted = true;
        result.candidateEmailSent = true;
        console.log(`[Resend Mock] Dispatched candidate notification to: ${candidateEmail}`);
      }
      return result;
    }

    // 1. Dispatch Recruiter Email (only if email was provided)
    if (session.recruiter_email?.trim()) {
      result.recruiterEmailAttempted = true;
      try {
        const recruiterHtml = this.generateHtmlEmail(
          'recruiter',
          candidateName,
          session.recruiter_name,
          session.recruiter_email,
          session.recruiter_company,
          session.recruiter_target_role,
          avatar.target_role,
          scorecard,
          messages
        );

        const response = await this.resend.emails.send({
          from: this.fromEmail,
          to: session.recruiter_email.trim(),
          subject: `Interview Scorecard & Transcript: ${candidateName}`,
          html: recruiterHtml,
          attachments,
        });

        if (response.error) {
          result.recruiterEmailSent = false;
          result.recruiterEmailError = response.error.message;
          console.error('[Resend Error] Failed to send email to recruiter:', response.error);
        } else {
          result.recruiterEmailSent = true;
        }
      } catch (err: any) {
        result.recruiterEmailSent = false;
        result.recruiterEmailError = err.message || 'Unknown error';
        console.error('[Resend Exception] Error sending email to recruiter:', err);
      }
    }

    // 2. Dispatch Candidate Email (if candidate email is present)
    if (candidateEmail?.trim()) {
      result.candidateEmailAttempted = true;
      try {
        const candidateHtml = this.generateHtmlEmail(
          'candidate',
          candidateName,
          session.recruiter_name,
          session.recruiter_email,
          session.recruiter_company,
          session.recruiter_target_role,
          avatar.target_role,
          scorecard,
          messages
        );

        const response = await this.resend.emails.send({
          from: this.fromEmail,
          to: candidateEmail.trim(),
          subject: `New Recruiter Interview: ${session.recruiter_name} interviewed your Avatar`,
          html: candidateHtml,
          attachments,
        });

        if (response.error) {
          result.candidateEmailSent = false;
          result.candidateEmailError = response.error.message;
          console.error('[Resend Error] Failed to send email to candidate:', response.error);
        } else {
          result.candidateEmailSent = true;
        }
      } catch (err: any) {
        result.candidateEmailSent = false;
        result.candidateEmailError = err.message || 'Unknown error';
        console.error('[Resend Exception] Error sending email to candidate:', err);
      }
    }

    return result;
  }
}

export const emailService = new EmailService();
