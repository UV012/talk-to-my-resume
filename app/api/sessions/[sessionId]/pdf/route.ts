import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateScorecardPdf } from '@/lib/pdf';
import { ChatMessage, Scorecard } from '@/types/database';

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const admin = createAdminClient();

    // Fetch session and details
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select(`
        *,
        scorecards (*),
        avatars:avatars (
          id,
          slug,
          target_role,
          users:users (email, display_name)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: messagesData } = await admin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const messages = (messagesData || []) as ChatMessage[];
    const avatarData: any = session.avatars;
    const candidateUser = Array.isArray(avatarData?.users) ? avatarData.users[0] : avatarData?.users;
    const candidateName = candidateUser?.display_name || 'Candidate';
    const candidateEmail = candidateUser?.email || '';

    const scorecardRecord = Array.isArray(session.scorecards)
      ? session.scorecards[0]
      : session.scorecards;

    const scorecard: Scorecard = scorecardRecord || {
      id: 'placeholder',
      session_id: sessionId,
      topic_coverage: {
        'Technical Skills': true,
        'Past Projects & Architecture': true,
      },
      key_evidence: [],
      open_questions: [],
      generated_at: new Date().toISOString(),
    };

    const pdfBuffer = generateScorecardPdf({
      session,
      avatar: avatarData,
      candidateName,
      candidateEmail,
      scorecard,
      messages,
    });

    const safeName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Interview_Brief_${safeName}_${sessionId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF download:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
