import { describe, it, expect } from 'vitest';
import { parseRecipientFile } from '../lib/csv-parser';

describe('parseRecipientFile', () => {
  it('parses CSV with headers correctly', () => {
    const csv = `name,email\nAda Lovelace,ada@example.com\nAlan Turing,alan@example.com`;
    const result = parseRecipientFile(csv, 'recipients.csv');
    expect(result.errors).toHaveLength(0);
    expect(result.recipients).toHaveLength(2);
    expect(result.recipients[0]).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(result.recipients[1]).toEqual({ name: 'Alan Turing', email: 'alan@example.com' });
  });

  it('parses CSV without headers correctly', () => {
    const csv = `Grace Hopper,grace@example.com\nJohn von Neumann,john@example.com`;
    const result = parseRecipientFile(csv, 'list.csv');
    expect(result.recipients).toHaveLength(2);
    expect(result.recipients[0].name).toBe('Grace Hopper');
  });

  it('parses JSON array of recipients correctly', () => {
    const json = JSON.stringify([
      { name: 'Margaret Hamilton', email: 'margaret@apollo.nasa.gov' },
      { name: 'Katherine Johnson' },
    ]);
    const result = parseRecipientFile(json, 'team.json');
    expect(result.recipients).toHaveLength(2);
    expect(result.recipients[0].name).toBe('Margaret Hamilton');
    expect(result.recipients[1].email).toBeUndefined();
  });

  it('handles malformed JSON gracefully', () => {
    const result = parseRecipientFile('{ not a json }', 'bad.json');
    expect(result.recipients).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('clamps recipient list to 500 max', () => {
    const largeList = Array.from({ length: 550 }, (_, i) => ({
      name: `Person ${i + 1}`,
      email: `p${i + 1}@example.com`,
    }));
    const json = JSON.stringify(largeList);
    const result = parseRecipientFile(json, 'large.json');
    expect(result.recipients).toHaveLength(500);
    expect(result.errors).toContain(
      'Maximum 500 recipients limit reached. Remaining rows were truncated.'
    );
  });
});
