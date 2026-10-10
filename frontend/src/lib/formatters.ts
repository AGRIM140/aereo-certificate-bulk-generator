/**
 * Data formatters for Archival Telemetry UI.
 */

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return isoString;
  }
}

export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDuration(
  startedAt: string | null | undefined,
  finishedAt: string | null | undefined
): string {
  if (!startedAt) return 'Queued';
  if (!finishedAt) return 'Running...';

  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(finishedAt).getTime();
    const diffMs = Math.max(0, end - start);

    if (diffMs < 1000) {
      return `${diffMs}ms`;
    }
    const seconds = (diffMs / 1000).toFixed(1);
    if (diffMs < 60000) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(diffMs / 60000);
    const remainingSeconds = Math.round((diffMs % 60000) / 1000);
    return `${minutes}m ${remainingSeconds}s`;
  } catch {
    return '—';
  }
}

export function shortenUuid(uuid: string): string {
  if (!uuid) return '';
  if (uuid.length <= 12) return uuid;
  return `${uuid.substring(0, 8)}...${uuid.substring(uuid.length - 4)}`;
}
