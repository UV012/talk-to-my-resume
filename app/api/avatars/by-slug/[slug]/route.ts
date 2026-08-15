import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug?.toLowerCase().trim();
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: avatar, error } = await admin
      .from('avatars')
      .select(`
        id,
        slug,
        status,
        visibility,
        target_role,
        users:users (id, display_name)
      `)
      .eq('slug', slug)
      .single();

    if (error || !avatar) {
      return NextResponse.json({ error: 'Candidate avatar not found.' }, { status: 404 });
    }

    const candidateUser = Array.isArray(avatar.users) ? avatar.users[0] : avatar.users;
    const candidateName = candidateUser?.display_name || 'Candidate';

    return NextResponse.json({
      id: avatar.id,
      slug: avatar.slug,
      status: avatar.status,
      visibility: avatar.visibility,
      target_role: avatar.target_role,
      candidate_name: candidateName,
    });
  } catch (error: any) {
    console.error('Error fetching public avatar by slug:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
