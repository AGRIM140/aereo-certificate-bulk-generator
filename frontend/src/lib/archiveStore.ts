/**
 * Persistent Client-Side Archive Store for Generation Jobs.
 * Allows users to archive/hide unwanted historical runs from the active ledger.
 */

import { useState, useEffect, useCallback } from 'react';

const ARCHIVE_STORAGE_KEY = 'bcg_archived_jobs';
const ARCHIVE_CHANGE_EVENT = 'bcg_archive_change';

function readStorage(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((item): item is string => typeof item === 'string'));
    }
  } catch {
    // Fallback on corrupt JSON or blocked storage
  }
  return new Set();
}

function writeStorage(set: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(new CustomEvent(ARCHIVE_CHANGE_EVENT));
  } catch {
    // Storage quota or security error
  }
}

/**
 * Retrieve the current set of archived job IDs.
 */
export function getArchivedJobIds(): Set<string> {
  return readStorage();
}

/**
 * Check if a specific job ID is currently archived.
 */
export function isJobArchived(jobId: string): boolean {
  return readStorage().has(jobId);
}

/**
 * Mark a job ID as archived.
 */
export function archiveJob(jobId: string): void {
  if (!jobId) return;
  const current = readStorage();
  if (!current.has(jobId)) {
    current.add(jobId);
    writeStorage(current);
  }
}

/**
 * Restore an archived job ID back to the active ledger.
 */
export function unarchiveJob(jobId: string): void {
  if (!jobId) return;
  const current = readStorage();
  if (current.has(jobId)) {
    current.delete(jobId);
    writeStorage(current);
  }
}

/**
 * Toggle the archived state for a job ID.
 * Returns true if now archived, false if now active.
 */
export function toggleArchiveJob(jobId: string): boolean {
  if (!jobId) return false;
  const current = readStorage();
  let nowArchived = false;
  if (current.has(jobId)) {
    current.delete(jobId);
    nowArchived = false;
  } else {
    current.add(jobId);
    nowArchived = true;
  }
  writeStorage(current);
  return nowArchived;
}

/**
 * Clear all archived jobs, restoring everything to active ledger.
 */
export function clearAllArchivedJobs(): void {
  writeStorage(new Set());
}

/**
 * React hook to reactively subscribe to archived job state.
 */
export function useArchivedJobs() {
  const [archivedSet, setArchivedSet] = useState<Set<string>>(() => getArchivedJobIds());

  useEffect(() => {
    const handleUpdate = () => {
      setArchivedSet(getArchivedJobIds());
    };

    window.addEventListener(ARCHIVE_CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(ARCHIVE_CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isArchived = useCallback((id: string) => archivedSet.has(id), [archivedSet]);
  const archive = useCallback((id: string) => archiveJob(id), []);
  const unarchive = useCallback((id: string) => unarchiveJob(id), []);
  const toggle = useCallback((id: string) => toggleArchiveJob(id), []);
  const clearAll = useCallback(() => clearAllArchivedJobs(), []);

  return {
    archivedSet,
    archivedCount: archivedSet.size,
    isArchived,
    archiveJob: archive,
    unarchiveJob: unarchive,
    toggleArchiveJob: toggle,
    clearAllArchivedJobs: clearAll,
  };
}
