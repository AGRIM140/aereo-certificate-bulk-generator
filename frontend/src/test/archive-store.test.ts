import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getArchivedJobIds,
  archiveJob,
  unarchiveJob,
  toggleArchiveJob,
  clearAllArchivedJobs,
  isJobArchived,
} from '../lib/archiveStore';

describe('Client Archive Store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with an empty archive set', () => {
    expect(getArchivedJobIds().size).toBe(0);
    expect(isJobArchived('test-job-1')).toBe(false);
  });

  it('reads persisted state after the store module is reloaded', async () => {
    archiveJob('persisted-job');
    vi.resetModules();
    const reloaded = await import('../lib/archiveStore');
    expect(reloaded.isJobArchived('persisted-job')).toBe(true);
    reloaded.unarchiveJob('persisted-job');
    expect(JSON.parse(window.localStorage.getItem('bcg_archived_jobs') || '[]')).toEqual([]);
  });

  it('does not crash when the browser blocks access to localStorage', () => {
    const blocked = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError');
    });
    try {
      expect(getArchivedJobIds().size).toBe(0);
      expect(() => archiveJob('test-job')).not.toThrow();
    } finally {
      blocked.mockRestore();
    }
  });

  it('archives a job and persists in localStorage', () => {
    archiveJob('job-abc-123');
    expect(isJobArchived('job-abc-123')).toBe(true);
    expect(getArchivedJobIds().has('job-abc-123')).toBe(true);

    const stored = JSON.parse(window.localStorage.getItem('bcg_archived_jobs') || '[]');
    expect(stored).toContain('job-abc-123');
  });

  it('unarchives a job and removes from localStorage', () => {
    archiveJob('job-abc-123');
    expect(isJobArchived('job-abc-123')).toBe(true);

    unarchiveJob('job-abc-123');
    expect(isJobArchived('job-abc-123')).toBe(false);
    expect(getArchivedJobIds().has('job-abc-123')).toBe(false);
  });

  it('toggles job archive state', () => {
    const isNowArchived = toggleArchiveJob('job-toggle-1');
    expect(isNowArchived).toBe(true);
    expect(isJobArchived('job-toggle-1')).toBe(true);

    const isNowUnarchived = toggleArchiveJob('job-toggle-1');
    expect(isNowUnarchived).toBe(false);
    expect(isJobArchived('job-toggle-1')).toBe(false);
  });

  it('clears all archived jobs', () => {
    archiveJob('job-1');
    archiveJob('job-2');
    archiveJob('job-3');
    expect(getArchivedJobIds().size).toBe(3);

    clearAllArchivedJobs();
    expect(getArchivedJobIds().size).toBe(0);
  });

  it('handles invalid or empty job ids gracefully', () => {
    archiveJob('');
    unarchiveJob('');
    expect(toggleArchiveJob('')).toBe(false);
    expect(getArchivedJobIds().size).toBe(0);
  });
});
