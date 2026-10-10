import type { RecipientInput } from '../types/api';

export interface ParseResult {
  recipients: RecipientInput[];
  errors: string[];
}

/**
 * Parses CSV or JSON recipient data completely in-browser.
 * Enforces the maximum 500 recipients limit.
 */
export function parseRecipientFile(content: string, filename: string): ParseResult {
  const isJson = filename.toLowerCase().endsWith('.json');
  if (isJson) {
    return parseJsonRecipients(content);
  }
  return parseCsvRecipients(content);
}

function parseJsonRecipients(content: string): ParseResult {
  const errors: string[] = [];
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return { recipients: [], errors: ['JSON file must contain an array of recipient objects.'] };
    }

    const recipients: RecipientInput[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (typeof item !== 'object' || item === null) {
        errors.push(`Row ${i + 1}: Expected an object with name and optional email.`);
        continue;
      }
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const email = typeof item.email === 'string' ? item.email.trim() : '';

      if (!name) {
        errors.push(`Row ${i + 1}: Name is required.`);
        continue;
      }

      recipients.push({ name, email: email || undefined });
      if (recipients.length >= 500) {
        errors.push('Maximum 500 recipients limit reached. Remaining rows were truncated.');
        break;
      }
    }

    return { recipients, errors };
  } catch (err) {
    return { recipients: [], errors: [`Failed to parse JSON file: ${err instanceof Error ? err.message : 'Invalid JSON'}`] };
  }
}

function parseCsvRecipients(content: string): ParseResult {
  const errors: string[] = [];
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length === 0) {
    return { recipients: [], errors: ['CSV file is empty.'] };
  }

  const recipients: RecipientInput[] = [];

  // Determine delimiter (comma or semicolon or tab)
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  // Check if first row is header
  let startIndex = 0;
  const firstCols = splitCsvLine(firstLine, delimiter).map((c) => c.toLowerCase());
  const nameIndex = firstCols.findIndex((c) => c === 'name' || c === 'recipient_name' || c === 'recipient');
  const emailIndex = firstCols.findIndex((c) => c === 'email' || c === 'recipient_email');

  let finalNameIdx = 0;
  let finalEmailIdx = 1;

  if (nameIndex !== -1) {
    startIndex = 1;
    finalNameIdx = nameIndex;
    finalEmailIdx = emailIndex !== -1 ? emailIndex : 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = splitCsvLine(rawLine, delimiter);
    if (cols.length === 0) continue;

    const name = (cols[finalNameIdx] || '').trim();
    const email = (cols[finalEmailIdx] || '').trim();

    if (!name) {
      errors.push(`Row ${i + 1}: Name is missing.`);
      continue;
    }

    recipients.push({ name, email: email || undefined });

    if (recipients.length >= 500) {
      errors.push('Maximum 500 recipients limit reached. Remaining rows were truncated.');
      break;
    }
  }

  return { recipients, errors };
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
