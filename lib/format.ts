/**
 * Strips raw [cite:N], [cite:N, M], or [cite:N][cite:M] citation tags from message text
 * while preserving clean sentence punctuation and spacing.
 */
export function stripCitationTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s*\[cite:[\d,\s]+\]/g, '') // remove tag(s) and any preceding space
    .replace(/\s+([.,!?;:])/g, '$1')      // collapse stray whitespace before punctuation
    .replace(/\s{2,}/g, ' ')              // collapse multiple spaces into single space
    .trim();
}

/**
 * Strips markdown syntax characters (bold, italics, headers, code backticks, links)
 * to produce clean plain text for PDF documents and email transcripts.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    // Remove bold and italic (e.g. **bold**, *italic*, __bold__, _italic_)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove headers (# Header -> Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes (> Quote -> Quote)
    .replace(/^>\s+/gm, '')
    // Format bullet points (* Item or - Item -> • Item)
    .replace(/^[\*\-\+]\s+/gm, '• ')
    // Remove inline code backticks (`code` -> code)
    .replace(/`([^`]+)`/g, '$1')
    // Remove code block wrappers (```lang ... ``` -> ...)
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```[a-zA-Z0-9_-]*\n?|```/g, '');
    })
    // Remove links ([text](url) -> text)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Clean up excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Strips both citation tags and markdown syntax to yield pure, readable plain text.
 */
export function formatPlainTextTranscript(text: string): string {
  if (!text) return '';
  return stripMarkdown(stripCitationTags(text));
}
