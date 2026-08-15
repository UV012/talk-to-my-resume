import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { status = 'published' } = await request.json();
    const avatarId = params.id;

    if (!['draft', 'published', 'paused'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify avatar exists and candidate owns it
    const { data: avatar } = await supabase
      .from('avatars')
      .select('id, candidate_id, slug')
      .eq('id', avatarId)
      .eq('candidate_id', user.id)
      .single();

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    // If publishing, ensure candidate has uploaded at least one document
    if (status === 'published') {
      const { count } = await admin
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('avatar_id', avatarId);

      if (!count || count === 0) {
        return NextResponse.json(
          { error: 'Cannot publish avatar without uploading a resume or knowledge base document first.' },
          { status: 400 }
        );
      }
    }

    const { data: updatedAvatar, error: updateError } = await supabase
      .from('avatars')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', avatarId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatar: updatedAvatar,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/u/${avatar.slug}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
