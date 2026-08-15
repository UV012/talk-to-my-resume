import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { defaultLLMClient } from '@/lib/ai/geminiClient';
import { retrieveRelevantChunks } from '@/lib/ai/rag';
import { ADVERSARIAL_PROBE_QUESTIONS } from '@/lib/ai/prompts';

export const maxDuration = 60; // Allow 60s for probe suite execution

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: checks } = await supabase
      .from('publish_checks')
      .select('*')
      .eq('avatar_id', params.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ checks: checks || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const avatarId = params.id;

    // Verify avatar ownership
    const { data: avatar } = await supabase
      .from('avatars')
      .select('id, target_role, slug')
      .eq('id', avatarId)
      .eq('candidate_id', user.id)
      .single();

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    const admin = createAdminClient();

    // Pull summary cache and sample chunks for context
    const { data: summaryRecord } = await admin
      .from('avatar_summary_cache')
      .select('summary_bullets')
      .eq('avatar_id', avatarId)
      .maybeSingle();

    const summaryBullets = summaryRecord?.summary_bullets || [];

    const { data: allChunksData } = await admin
      .from('document_chunks')
      .select('content')
      .eq('avatar_id', avatarId)
      .limit(20);

    const fullKnowledgeBaseText = (allChunksData || []).map((c) => c.content).join('\n\n');
    const candidateName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Candidate';

    // Clear previous probe checks for fresh run
    await admin.from('publish_checks').delete().eq('avatar_id', avatarId);

    const probeResults = [];

    for (const question of ADVERSARIAL_PROBE_QUESTIONS) {
      // 1. Retrieve any matching chunks for probe
      const matchingChunks = await retrieveRelevantChunks(
        admin,
        avatarId,
        question,
        defaultLLMClient,
        0.3,
        3
      );

      // 2. Generate avatar answer
      const answerResult = await defaultLLMClient.generateChatResponse({
        candidateName,
        targetRole: avatar.target_role,
        summaryBullets,
        retrievedChunks: matchingChunks,
        history: [],
        userMessage: question,
      });

      // 3. Verify grounding
      const verification = await defaultLLMClient.verifyGrounding(
        question,
        answerResult.content,
        fullKnowledgeBaseText || 'Empty knowledge base.'
      );

      // 4. Store in publish_checks
      const { data: savedCheck, error: checkError } = await admin
        .from('publish_checks')
        .insert({
          avatar_id: avatarId,
          probe_question: question,
          avatar_answer: answerResult.content,
          flagged: verification.flagged,
          flag_reason: verification.reason,
        })
        .select()
        .single();

      if (!checkError && savedCheck) {
        probeResults.push(savedCheck);
      }
    }

    const hasFlagged = probeResults.some((p) => p.flagged);

    return NextResponse.json({
      success: true,
      checks: probeResults,
      hasFlagged,
    });
  } catch (error: any) {
    console.error('Error running pre-publish safety checks:', error);
    return NextResponse.json({ error: error.message || 'Probe checks failed' }, { status: 500 });
  }
}
