import { capitalize } from '@/lib/utils';

type Status = 'pending' | 'qualified' | 'contacted' | 'rejected' | 'spam' | string;

interface StatusBadgeProps {
  status?: Status | null;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  qualified: { bg: '#DBEAFE', text: '#1E40AF', label: 'Qualified' },
  contacted: { bg: '#DCFCE7', text: '#15803D', label: 'Contacted' },
  rejected:  { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected' },
  spam:      { bg: '#FEE2E2', text: '#991B1B', label: 'Spam' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = status?.toLowerCase() ?? 'pending';
  const config = statusConfig[key] ?? {
    bg: '#F3F4F6',
    text: '#4B5563',
    label: capitalize(status ?? 'Unknown'),
  };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
