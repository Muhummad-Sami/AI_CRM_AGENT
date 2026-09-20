// ============================================================
// Utility helpers — date formatting, score colors, etc.
// ============================================================

// ------ Date / time formatting ------

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ------ Score utilities ------

export function getScoreColor(score?: number | null): string {
  if (score == null) return 'text-[#98A2B3]';
  if (score >= 70) return 'text-[#16A34A]';
  if (score >= 40) return 'text-[#D97706]';
  return 'text-[#DC2626]';
}

export function getScoreBarColor(score?: number | null): string {
  if (score == null) return 'bg-[#E4E7EC]';
  if (score >= 70) return 'bg-[#16A34A]';
  if (score >= 40) return 'bg-[#D97706]';
  return 'bg-[#DC2626]';
}

// ------ Text truncation ------

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

// ------ Capitalize ------

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ------ Group leads by day (for chart) ------

export function groupLeadsByDay(
  leads: Array<{ created_at?: string | null }>
): Record<string, number> {
  const grouped: Record<string, number> = {};
  for (const lead of leads) {
    if (!lead.created_at) continue;
    const day = new Date(lead.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    grouped[day] = (grouped[day] ?? 0) + 1;
  }
  return grouped;
}

// ------ Class name joiner ------

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
