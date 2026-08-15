import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: avatars, error: fetchError } = await supabase
      .from('avatars')
      .select(`
        *,
        knowledge_sources:knowledge_sources(count),
        chat_sessions:chat_sessions(count)
      `)
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ avatars: avatars || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { target_role, slug: rawSlug, visibility = 'public', permissioned_emails = [] } = body;

    // Generate or clean slug
    const cleanSlug = (rawSlug || user.email?.split('@')[0] || `candidate-${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

    // Check slug uniqueness
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('avatars')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle();

    const finalSlug = existing ? `${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}` : cleanSlug;

    // Ensure candidate row exists in public.users
    await admin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Candidate',
      })
      .select();

    const { data: avatar, error: insertError } = await supabase
      .from('avatars')
      .insert({
        candidate_id: user.id,
        slug: finalSlug,
        status: 'draft',
        visibility,
        permissioned_emails,
        target_role: target_role || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ avatar }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
