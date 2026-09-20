import { capitalize } from '@/lib/utils';

type Priority = 'high' | 'medium' | 'low' | string;

interface PriorityBadgeProps {
  priority?: Priority | null;
}

const priorityConfig: Record<string, { bg: string; text: string }> = {
  high:   { bg: '#FEE2E2', text: '#991B1B' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  low:    { bg: '#F3F4F6', text: '#4B5563' },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const key = priority?.toLowerCase() ?? 'low';
  const config = priorityConfig[key] ?? { bg: '#F3F4F6', text: '#4B5563' };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {capitalize(priority ?? '—')}
    </span>
  );
}
