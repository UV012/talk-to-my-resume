import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimiter, SESSION_MESSAGE_LIMIT } from '@/lib/ratelimit';
import { retrieveRelevantChunks } from '@/lib/ai/rag';
import { defaultLLMClient } from '@/lib/ai/geminiClient';
import { ChatMessage } from '@/types/database';

export const maxDuration = 45; // Allow 45s for RAG and inference

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || !message?.trim()) {
      return NextResponse.json({ error: 'Session ID and message are required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch session and avatar info
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select(`
        id,
        avatar_id,
        message_count,
        ended_at,
        avatars:avatars (
          id,
          target_role,
          status,
          users:users (display_name, email)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Chat session not found.' }, { status: 404 });
    }

    if (session.ended_at) {
      return NextResponse.json(
        { error: 'This interview session has already ended.' },
        { status: 400 }
      );
    }

    const avatarData: any = session.avatars;
    if (avatarData.status === 'paused') {
      return NextResponse.json(
        { error: 'This avatar is currently paused by the candidate.' },
        { status: 403 }
      );
    }

    // 2. Enforce Rate Limiting (Session Cap: 20, Avatar Daily Cap: 100)
    const sessionLimitCheck = await rateLimiter.checkSessionLimit(sessionId, session.message_count);
    if (!sessionLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: sessionLimitCheck.message,
          rateLimitExceeded: true,
          limitType: 'session',
        },
        { status: 429 }
      );
    }

    const avatarDailyLimitCheck = await rateLimiter.checkAvatarDailyLimit(session.avatar_id);
    if (!avatarDailyLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: avatarDailyLimitCheck.message,
          rateLimitExceeded: true,
          limitType: 'avatar_daily',
        },
        { status: 429 }
      );
    }

    const candidateUser = Array.isArray(avatarData.users) ? avatarData.users[0] : avatarData.users;
    const candidateName = candidateUser?.display_name || 'Candidate';

    // 3. Save recruiter's message
    await admin.from('chat_messages').insert({
      session_id: sessionId,
      role: 'hr',
      content: message.trim(),
      citations: [],
    });

    // 4. Semantic Search scoped STRICTLY to this avatar_id
    const retrievedChunks = await retrieveRelevantChunks(
      admin,
      session.avatar_id,
      message,
      defaultLLMClient,
      0.25,
      5
    );

    // Fetch last 10 messages for conversation context
    const { data: recentHistory } = await admin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const historyFormatted = (recentHistory || []).map((m) => ({
      role: m.role as 'hr' | 'avatar',
      content: m.content,
    }));

    // 5. Generate first-person avatar response with fresh semantic grounding
    const aiResult = await defaultLLMClient.generateChatResponse({
      candidateName,
      targetRole: avatarData.target_role,
      retrievedChunks,
      history: historyFormatted,
      userMessage: message.trim(),
    });

    const avatarResponseContent = aiResult.content;
    const citations = aiResult.citations;

    // 6. Save avatar's response
    const { data: avatarMessageRow } = await admin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'avatar',
        content: avatarResponseContent,
        citations,
      })
      .select()
      .single();

    // 7. Increment session message count
    const updatedCount = (session.message_count || 0) + 1;
    await admin
      .from('chat_sessions')
      .update({ message_count: updatedCount })
      .eq('id', sessionId);

    return NextResponse.json({
      message: avatarMessageRow as ChatMessage,
      remainingSessionMessages: Math.max(0, SESSION_MESSAGE_LIMIT - updatedCount),
      sessionEnded: updatedCount >= SESSION_MESSAGE_LIMIT,
    });
  } catch (error: any) {
    console.error('Error handling chat message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    );
  }
}
