import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { data: avatar, error: fetchError } = await supabase
      .from('avatars')
      .select(`
        *,
        avatar_summary_cache (*),
        knowledge_sources (*),
        chat_sessions (*),
        publish_checks (*)
      `)
      .eq('id', params.id)
      .eq('candidate_id', user.id)
      .single();

    if (fetchError || !avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    return NextResponse.json({ avatar });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { slug, status, visibility, permissioned_emails, target_role } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (slug) updates.slug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    if (status) updates.status = status;
    if (visibility) updates.visibility = visibility;
    if (permissioned_emails !== undefined) updates.permissioned_emails = permissioned_emails;
    if (target_role !== undefined) updates.target_role = target_role;

    const { data: updatedAvatar, error: updateError } = await supabase
      .from('avatars')
      .update(updates)
      .eq('id', params.id)
      .eq('candidate_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ avatar: updatedAvatar });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Verify avatar ownership
    const { data: avatar } = await supabase
      .from('avatars')
      .select('id')
      .eq('id', params.id)
      .eq('candidate_id', user.id)
      .single();

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    const admin = createAdminClient();

    // Clean up Supabase Storage folder
    try {
      const folderPath = `${user.id}/${params.id}`;
      const { data: files } = await admin.storage.from('knowledge-files').list(folderPath);
      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${folderPath}/${f.name}`);
        await admin.storage.from('knowledge-files').remove(filePaths);
      }
    } catch (storageErr) {
      console.warn('Storage cleanup non-critical error:', storageErr);
    }

    // Delete avatar row (cascades all chunks, sources, sessions, summary cache, publish checks in Postgres)
    const { error: deleteError } = await supabase
      .from('avatars')
      .delete()
      .eq('id', params.id)
      .eq('candidate_id', user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
