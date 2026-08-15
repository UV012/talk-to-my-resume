import yaml from 'yaml';

export interface ParsedSection {
  label: string;
  content: string;
  sourceCitation: string;
}

export interface ParseResult {
  fullText: string;
  sections: ParsedSection[];
}

/**
 * Standard section regex patterns common in resumes and profile docs
 */
const SECTION_HEADERS: Array<{ label: string; regex: RegExp }> = [
  { label: 'Summary & Profile', regex: /^(?:summary|professional summary|profile|about me|overview|career objective)[\s:]*$/im },
  { label: 'Work Experience', regex: /^(?:experience|work experience|employment history|work history|professional experience|career history)[\s:]*$/im },
  { label: 'Skills & Proficiencies', regex: /^(?:skills|technical skills|core competencies|areas of expertise|proficiencies|technologies)[\s:]*$/im },
  { label: 'Education', regex: /^(?:education|academic background|qualifications|academic history)[\s:]*$/im },
  { label: 'Projects', regex: /^(?:projects|personal projects|key projects|notable projects|portfolio)[\s:]*$/im },
  { label: 'Certifications & Awards', regex: /^(?:certifications|certificates|awards|honors|licenses|achievements)[\s:]*$/im },
  { label: 'Publications & Speaking', regex: /^(?:publications|talks|conferences|presentations|patents)[\s:]*$/im },
  { label: 'Volunteer & Leadership', regex: /^(?:volunteer|leadership|community|extracurricular)[\s:]*$/im },
];

/**
 * Parse structured sections from raw text lines
 */
export function extractStructuredSections(rawText: string, sourceName: string): ParsedSection[] {
  const lines = rawText.split(/\r?\n/);
  const sections: ParsedSection[] = [];

  let currentLabel = 'General Information';
  let currentLines: string[] = [];
  let startLineNum = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentLines.length > 0) {
        currentLines.push('');
      }
      continue;
    }

    // Check if line matches any standard section header
    let matchedLabel: string | null = null;
    if (line.length < 50) {
      for (const header of SECTION_HEADERS) {
        if (header.regex.test(line)) {
          matchedLabel = header.label;
          break;
        }
      }
    }

    if (matchedLabel) {
      // Flush previous section if it has content
      const content = currentLines.join('\n').trim();
      if (content.length > 0) {
        const endLineNum = i;
        sections.push({
          label: currentLabel,
          content,
          sourceCitation: `${sourceName}, ${currentLabel} (lines ${startLineNum}-${endLineNum})`,
        });
      }

      currentLabel = matchedLabel;
      currentLines = [];
      startLineNum = i + 1;
    } else {
      currentLines.push(lines[i]);
    }
  }

  // Flush last section
  const lastContent = currentLines.join('\n').trim();
  if (lastContent.length > 0) {
    sections.push({
      label: currentLabel,
      content: lastContent,
      sourceCitation: `${sourceName}, ${currentLabel} (lines ${startLineNum}-${lines.length})`,
    });
  }

  // If no sections were identified, return the full text as a single section
  if (sections.length === 0 && rawText.trim().length > 0) {
    sections.push({
      label: 'General Information',
      content: rawText.trim(),
      sourceCitation: `${sourceName}, Document Content`,
    });
  }

  return sections;
}

/**
 * Parse YAML content into structured sections
 */
export function parseYamlContent(rawYaml: string, sourceName: string): ParseResult {
  try {
    const parsed = yaml.parse(rawYaml);
    const sections: ParsedSection[] = [];
    const fullTextParts: string[] = [];

    if (typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(parsed)) {
        parsed.forEach((item, idx) => {
          const itemText = typeof item === 'object' ? yaml.stringify(item).trim() : String(item);
          sections.push({
            label: `Entry #${idx + 1}`,
            content: itemText,
            sourceCitation: `${sourceName}, item #${idx + 1}`,
          });
          fullTextParts.push(itemText);
        });
      } else {
        for (const [key, value] of Object.entries(parsed)) {
          let contentStr = '';
          if (typeof value === 'object' && value !== null) {
            contentStr = yaml.stringify(value).trim();
          } else {
            contentStr = String(value).trim();
          }

          if (contentStr) {
            // Capitalize section key for readability
            const formattedLabel = key
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());

            sections.push({
              label: formattedLabel,
              content: contentStr,
              sourceCitation: `${sourceName}, [${key}] section`,
            });
            fullTextParts.push(`${formattedLabel}:\n${contentStr}`);
          }
        }
      }
    }

    if (sections.length === 0) {
      return {
        fullText: rawYaml.trim(),
        sections: extractStructuredSections(rawYaml, sourceName),
      };
    }

    return {
      fullText: fullTextParts.join('\n\n'),
      sections,
    };
  } catch (error) {
    // If yaml parsing fails, fallback to standard text section parsing
    return {
      fullText: rawYaml.trim(),
      sections: extractStructuredSections(rawYaml, sourceName),
    };
  }
}

/**
 * Main parser entrypoint for all supported file formats
 */
export async function parseDocument(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<ParseResult> {
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  // 1. PDF
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    // Dynamically import pdf-parse to avoid edge runtime issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const text = data.text || '';
    return {
      fullText: text.trim(),
      sections: extractStructuredSections(text, filename),
    };
  }

  // 2. DOCX
  if (
    extension === 'docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    return {
      fullText: text.trim(),
      sections: extractStructuredSections(text, filename),
    };
  }

  // 3. YAML
  if (
    extension === 'yaml' ||
    extension === 'yml' ||
    mimeType === 'text/yaml' ||
    mimeType === 'application/x-yaml'
  ) {
    const rawYaml = buffer.toString('utf-8');
    return parseYamlContent(rawYaml, filename);
  }

  // 4. Markdown & Plain text fallback
  const rawText = buffer.toString('utf-8');
  return {
    fullText: rawText.trim(),
    sections: extractStructuredSections(rawText, filename),
  };
}
