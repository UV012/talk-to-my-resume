import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { defaultLLMClient } from '@/lib/ai/geminiClient';
import { generateScorecardPdf } from '@/lib/pdf';
import { emailService } from '@/lib/email';
import { ChatMessage, Scorecard } from '@/types/database';

export const maxDuration = 60; // Allow 60s for scorecard generation, PDF rendering, and email dispatch

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch session, avatar, and candidate metadata
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select(`
        *,
        avatars:avatars (
          id,
          slug,
          target_role,
          candidate_id,
          users:users (id, email, display_name)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Chat session not found.' }, { status: 404 });
    }

    // 2. Fetch all messages in the session
    const { data: messagesData } = await admin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const messages = (messagesData || []) as ChatMessage[];

    const avatarData: any = session.avatars;
    const candidateUser = Array.isArray(avatarData.users) ? avatarData.users[0] : avatarData.users;
    const candidateName = candidateUser?.display_name || 'Candidate';
    const candidateEmail = candidateUser?.email || '';

    // 3. Mark session as ended
    const endedAt = new Date().toISOString();
    await admin
      .from('chat_sessions')
      .update({ ended_at: endedAt })
      .eq('id', sessionId);

    // 4. Fetch candidate knowledge chunks for scorecard generation context
    const { data: knowledgeChunks } = await admin
      .from('document_chunks')
      .select('content')
      .eq('avatar_id', session.avatar_id)
      .limit(30);

    const allKnowledgeText = (knowledgeChunks || []).map((c) => c.content).join('\n\n');

    // Build transcript string
    const transcriptText = messages
      .map((m) => `${m.role === 'avatar' ? `${candidateName}'s Avatar` : session.recruiter_name}: ${m.content}`)
      .join('\n\n');

    const effectiveTargetRole = session.recruiter_target_role || avatarData.target_role;

    // 5. Generate Scorecard via Gemini
    const scorecardResult = await defaultLLMClient.generateScorecard(
      candidateName,
      transcriptText || 'No messages exchanged.',
      allKnowledgeText || 'No documents on file.',
      effectiveTargetRole
    );

    // 6. Save or update Scorecard in DB
    const { data: savedScorecard, error: scorecardError } = await admin
      .from('scorecards')
      .upsert(
        {
          session_id: sessionId,
          topic_coverage: scorecardResult.topic_coverage,
          key_evidence: scorecardResult.key_evidence,
          open_questions: scorecardResult.open_questions,
          generated_at: endedAt,
        },
        { onConflict: 'session_id' }
      )
      .select()
      .single();

    if (scorecardError) {
      console.error('Error saving scorecard:', scorecardError);
    }

    const finalScorecard: Scorecard = savedScorecard || {
      id: 'temp-id',
      session_id: sessionId,
      topic_coverage: scorecardResult.topic_coverage,
      key_evidence: scorecardResult.key_evidence,
      open_questions: scorecardResult.open_questions,
      generated_at: endedAt,
    };

    // 7. Generate PDF report buffer
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = generateScorecardPdf({
        session: { ...session, ended_at: endedAt },
        avatar: avatarData,
        candidateName,
        candidateEmail,
        scorecard: finalScorecard,
        messages,
      });
    } catch (pdfErr) {
      console.error('Error generating PDF:', pdfErr);
    }

    // 8. Dispatch emails to recruiter and candidate
    let emailDelivery = {
      recruiterEmailAttempted: false,
      recruiterEmailSent: false,
      candidateEmailAttempted: false,
      candidateEmailSent: false,
    };

    try {
      const emailResult = await emailService.sendSessionCompletionEmails({
        session: { ...session, ended_at: endedAt },
        avatar: avatarData,
        candidateName,
        candidateEmail,
        scorecard: finalScorecard,
        messages,
        pdfBuffer,
      });

      emailDelivery = {
        recruiterEmailAttempted: emailResult.recruiterEmailAttempted,
        recruiterEmailSent: emailResult.recruiterEmailSent,
        candidateEmailAttempted: emailResult.candidateEmailAttempted,
        candidateEmailSent: emailResult.candidateEmailSent,
      };
    } catch (emailErr) {
      console.error('Error sending session completion emails:', emailErr);
    }

    return NextResponse.json({
      success: true,
      scorecard: finalScorecard,
      sessionEndedAt: endedAt,
      pdfDownloadUrl: `/api/sessions/${sessionId}/pdf`,
      emailDelivery,
    });
  } catch (error: any) {
    console.error('Error ending chat session:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
