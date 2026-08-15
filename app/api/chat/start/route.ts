import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, recruiter_name, recruiter_email, recruiter_company, recruiter_target_role, target_role } = body;

    const assignedTargetRole = recruiter_target_role || target_role || null;

    if (!slug || !recruiter_name?.trim()) {
      return NextResponse.json(
        { error: 'Candidate slug and recruiter name are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = recruiter_email?.trim() || null;
    if (trimmedEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmedEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
    }

    const admin = createAdminClient();

    // 1. Fetch avatar and candidate info
    const { data: avatar, error: avatarError } = await admin
      .from('avatars')
      .select(`
        id,
        slug,
        status,
        visibility,
        permissioned_emails,
        target_role,
        candidate_id,
        users:users (id, email, display_name),
        avatar_summary_cache (summary_bullets)
      `)
      .eq('slug', slug.toLowerCase().trim())
      .single();

    if (avatarError || !avatar) {
      return NextResponse.json({ error: 'Candidate avatar not found.' }, { status: 404 });
    }

    // 2. Check avatar status
    if (avatar.status === 'paused') {
      return NextResponse.json(
        { error: 'This candidate avatar is currently paused and not accepting interviews.' },
        { status: 403 }
      );
    }

    if (avatar.status === 'draft') {
      return NextResponse.json(
        { error: 'This candidate avatar is currently in draft mode and not yet published.' },
        { status: 403 }
      );
    }

    // 3. Enforce visibility rules
    if (avatar.visibility === 'permissioned') {
      if (!trimmedEmail) {
        return NextResponse.json(
          {
            error:
              'This candidate has restricted their avatar to specific recruiters. An email address matching the candidate’s allow-list is required to proceed.',
          },
          { status: 400 }
        );
      }

      const allowedList = (avatar.permissioned_emails || []).map((e: string) => e.toLowerCase().trim());
      const normalizedEmail = trimmedEmail.toLowerCase();

      if (!allowedList.includes(normalizedEmail)) {
        return NextResponse.json(
          {
            error:
              'You do not have access permission to interview this avatar. Please request an invitation from the candidate.',
          },
          { status: 403 }
        );
      }
    }

    // 4. Create chat_sessions row via service role
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .insert({
        avatar_id: avatar.id,
        recruiter_name: recruiter_name.trim(),
        recruiter_email: trimmedEmail ? trimmedEmail.toLowerCase() : null,
        recruiter_company: recruiter_company?.trim() || null,
        recruiter_target_role: assignedTargetRole?.trim() || null,
        message_count: 0,
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Error creating chat session:', sessionError);
      return NextResponse.json({ error: 'Failed to initiate interview session.' }, { status: 500 });
    }

    const candidateUser = Array.isArray(avatar.users) ? avatar.users[0] : avatar.users;
    const candidateName = candidateUser?.display_name || 'Candidate';
    const summaryRecord = Array.isArray(avatar.avatar_summary_cache)
      ? avatar.avatar_summary_cache[0]
      : avatar.avatar_summary_cache;

    return NextResponse.json({
      session,
      avatar: {
        id: avatar.id,
        slug: avatar.slug,
        visibility: avatar.visibility,
        target_role: avatar.target_role,
        candidate_name: candidateName,
        summary_bullets: summaryRecord?.summary_bullets || [],
      },
    });
  } catch (error: any) {
    console.error('Error starting chat session:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
