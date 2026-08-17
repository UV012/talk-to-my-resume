import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; sourceId: string } }
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

    const { id: avatarId, sourceId } = params;

    // Verify avatar ownership
    const { data: avatar } = await supabase
      .from('avatars')
      .select('id, candidate_id')
      .eq('id', avatarId)
      .eq('candidate_id', user.id)
      .single();

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    const admin = createAdminClient();

    // Fetch knowledge source to get file path
    const { data: source } = await admin
      .from('knowledge_sources')
      .select('id, file_url')
      .eq('id', sourceId)
      .eq('avatar_id', avatarId)
      .single();

    if (source) {
      // Remove file from Supabase Storage
      try {
        await admin.storage.from('knowledge-files').remove([source.file_url]);
      } catch (err) {
        console.warn('Storage delete warning:', err);
      }

      // Delete knowledge_sources row (Postgres foreign key cascades document_chunks)
      await admin.from('knowledge_sources').delete().eq('id', sourceId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
