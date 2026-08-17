import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDocument } from '@/lib/parsers/documentParser';
import { chunkSections, storeDocumentChunks } from '@/lib/ai/rag';
import { defaultLLMClient } from '@/lib/ai/geminiClient';
import { KnowledgeFileType } from '@/types/database';

export const maxDuration = 60; // Allow 60s for parsing and embedding generation on Vercel

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
    const { data: avatar, error: avatarErr } = await supabase
      .from('avatars')
      .select('id, candidate_id, target_role, slug')
      .eq('id', avatarId)
      .eq('candidate_id', user.id)
      .single();

    if (avatarErr || !avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = (formData.get('fileType') as KnowledgeFileType) || 'resume';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate allowed file extensions
    const filename = file.name;
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'docx', 'yaml', 'yml', 'md', 'markdown', 'txt'];

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Unsupported file type (.${extension}). Please upload PDF, DOCX, YAML, Markdown, or TXT.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload original file to Supabase Storage (private bucket: knowledge-files)
    const admin = createAdminClient();
    const sanitizedFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `${user.id}/${avatarId}/${sanitizedFilename}`;

    const { error: uploadError } = await admin.storage
      .from('knowledge-files')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Storage upload note:', uploadError.message);
    }

    // 2. Parse file content into structured sections & source citations
    const parseResult = await parseDocument(buffer, filename, file.type);
    const chunks = chunkSections(parseResult.sections);

    // 3. Create knowledge_sources record
    const { data: knowledgeSource, error: sourceError } = await admin
      .from('knowledge_sources')
      .insert({
        avatar_id: avatarId,
        file_url: storagePath,
        file_type: fileType,
        original_filename: filename,
        parsed_status: 'completed',
      })
      .select()
      .single();

    if (sourceError || !knowledgeSource) {
      return NextResponse.json({ error: 'Failed to record knowledge source' }, { status: 500 });
    }

    // 4. Store document chunks with Gemini embeddings
    const storedCount = await storeDocumentChunks(
      admin,
      avatarId,
      knowledgeSource.id,
      chunks,
      defaultLLMClient
    );

    return NextResponse.json({
      success: true,
      knowledgeSource,
      chunksCreated: storedCount,
    });
  } catch (error: any) {
    console.error('Error in file upload and parsing pipeline:', error);
    return NextResponse.json({ error: error.message || 'File processing failed' }, { status: 500 });
  }
}
