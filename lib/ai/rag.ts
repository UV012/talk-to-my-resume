import { ParsedSection } from '@/lib/parsers/documentParser';
import { LLMClient } from './llmClient';
import { MatchedChunk } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ChunkToStore {
  content: string;
  sectionLabel: string | null;
  sourceCitation: string;
}

/**
 * Split parsed document sections into optimal chunks for semantic search
 */
export function chunkSections(sections: ParsedSection[], maxChunkSize = 700): ChunkToStore[] {
  const chunks: ChunkToStore[] = [];

  for (const section of sections) {
    const text = section.content.trim();
    if (!text) continue;

    // If section content fits within maxChunkSize, keep as single chunk
    if (text.length <= maxChunkSize) {
      chunks.push({
        content: text,
        sectionLabel: section.label,
        sourceCitation: section.sourceCitation,
      });
      continue;
    }

    // Split larger sections by paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    let partIndex = 1;

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length <= maxChunkSize) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
      } else {
        if (currentChunk) {
          chunks.push({
            content: currentChunk.trim(),
            sectionLabel: section.label,
            sourceCitation: `${section.sourceCitation} (part ${partIndex})`,
          });
          partIndex++;
          currentChunk = '';
        }

        // If paragraph itself is larger than maxChunkSize, split by sentence or slice
        if (para.length > maxChunkSize) {
          const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) || [];
          if (sentences.length > 1) {
            let subChunk = '';
            for (const sentence of sentences) {
              if ((subChunk + sentence).length <= maxChunkSize) {
                subChunk += sentence;
              } else {
                if (subChunk) {
                  chunks.push({
                    content: subChunk.trim(),
                    sectionLabel: section.label,
                    sourceCitation: `${section.sourceCitation} (part ${partIndex})`,
                  });
                  partIndex++;
                }
                subChunk = sentence;
              }
            }
            currentChunk = subChunk;
          } else {
            // Hard chunking by character slice for continuous text
            for (let i = 0; i < para.length; i += maxChunkSize) {
              const slice = para.slice(i, i + maxChunkSize).trim();
              if (slice) {
                chunks.push({
                  content: slice,
                  sectionLabel: section.label,
                  sourceCitation: `${section.sourceCitation} (part ${partIndex})`,
                });
                partIndex++;
              }
            }
            currentChunk = '';
          }
        } else {
          currentChunk = para;
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        sectionLabel: section.label,
        sourceCitation: partIndex > 1 ? `${section.sourceCitation} (part ${partIndex})` : section.sourceCitation,
      });
    }
  }

  return chunks;
}

/**
 * Embed and store chunks in the document_chunks table scoped to an avatar_id
 */
export async function storeDocumentChunks(
  supabase: SupabaseClient,
  avatarId: string,
  knowledgeSourceId: string,
  chunks: ChunkToStore[],
  llmClient: LLMClient
): Promise<number> {
  if (chunks.length === 0) return 0;

  const rowsToInsert = [];

  for (const chunk of chunks) {
    const embedding = await llmClient.generateEmbedding(chunk.content);
    rowsToInsert.push({
      avatar_id: avatarId,
      knowledge_source_id: knowledgeSourceId,
      content: chunk.content,
      embedding,
      section_label: chunk.sectionLabel,
      source_citation: chunk.sourceCitation,
    });
  }

  // Insert in batches of 25
  const batchSize = 25;
  for (let i = 0; i < rowsToInsert.length; i += batchSize) {
    const batch = rowsToInsert.slice(i, i + batchSize);
    const { error } = await supabase.from('document_chunks').insert(batch);
    if (error) {
      console.error('Error inserting document_chunks batch:', error);
      throw error;
    }
  }

  return rowsToInsert.length;
}

/**
 * Strictly scoped retrieval query utilizing the match_document_chunks Postgres RPC function
 */
export async function retrieveRelevantChunks(
  supabase: SupabaseClient,
  avatarId: string,
  query: string,
  llmClient: LLMClient,
  matchThreshold = 0.25,
  matchCount = 5
): Promise<MatchedChunk[]> {
  try {
    const queryEmbedding = await llmClient.generateEmbedding(query);

    const { data, error } = await supabase.rpc('match_document_chunks', {
      target_avatar_id: avatarId,
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.warn('RPC match_document_chunks fallback:', error.message);
      const { data: directData } = await supabase
        .from('document_chunks')
        .select('id, avatar_id, knowledge_source_id, content, section_label, source_citation')
        .eq('avatar_id', avatarId)
        .limit(matchCount);

      return (directData || []).map((row) => ({
        id: row.id,
        avatar_id: row.avatar_id,
        knowledge_source_id: row.knowledge_source_id,
        content: row.content,
        section_label: row.section_label,
        source_citation: row.source_citation,
        similarity: 0.8,
      }));
    }

    return (data || []) as MatchedChunk[];
  } catch (err) {
    console.error('Error in retrieveRelevantChunks:', err);
    return [];
  }
}
