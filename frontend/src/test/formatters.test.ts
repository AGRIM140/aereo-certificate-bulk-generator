import { describe, it, expect } from 'vitest';
import { formatDateTime, formatDateOnly, formatDuration, shortenUuid } from '../lib/formatters';

describe('formatDateTime', () => {
  it('formats valid ISO timestamp into readable UTC string', () => {
    const formatted = formatDateTime('2026-10-08T18:00:00Z');
    expect(formatted).toBe('2026-10-08 18:00:00 UTC');
  });

  it('handles null and undefined gracefully', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });
});

describe('formatDateOnly', () => {
  it('formats date string into locale date', () => {
    const formatted = formatDateOnly('2026-10-08');
    expect(formatted).toContain('2026');
  });

  it('handles null gracefully', () => {
    expect(formatDateOnly(null)).toBe('—');
  });
});

describe('formatDuration', () => {
  it('returns Queued when startedAt is null', () => {
    expect(formatDuration(null, null)).toBe('Queued');
  });

  it('returns Running... when startedAt is set but finishedAt is null', () => {
    expect(formatDuration('2026-10-08T18:00:00Z', null)).toBe('Running...');
  });

  it('formats seconds correctly', () => {
    const start = '2026-10-08T18:00:00Z';
    const end = '2026-10-08T18:00:04.500Z';
    expect(formatDuration(start, end)).toBe('4.5s');
  });

  it('formats minutes and seconds correctly', () => {
    const start = '2026-10-08T18:00:00Z';
    const end = '2026-10-08T18:02:15Z';
    expect(formatDuration(start, end)).toBe('2m 15s');
  });
});

describe('shortenUuid', () => {
  it('shortens 36-char UUID to prefix and suffix', () => {
    const uuid = 'e4da7a17-3b4a-48dc-aed3-c750c6ad94d3';
    expect(shortenUuid(uuid)).toBe('e4da7a17...94d3');
  });

  it('returns empty string if null or empty', () => {
    expect(shortenUuid('')).toBe('');
  });
});
