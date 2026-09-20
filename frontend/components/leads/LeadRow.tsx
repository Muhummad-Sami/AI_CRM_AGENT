'use client';

import { useRouter } from 'next/navigation';
import type { Lead } from '@/lib/api';
import { formatRelativeTime, truncate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import ScoreIndicator from '@/components/ui/ScoreIndicator';

interface LeadRowProps {
  lead: Lead;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

export default function LeadRow({
  lead,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDelete,
}: LeadRowProps) {
  const router = useRouter();

  function handleRowClick(e: React.MouseEvent) {
    // Prevent navigation if clicking interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }
    router.push(`/admin/leads/${lead.id}`);
  }

  return (
    <tr
      onClick={handleRowClick}
      className={`border-b border-[#E4E7EC] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors ${
        isSelected ? 'bg-[#EFF6FF]' : ''
      }`}
    >
      {/* Selection Checkbox */}
      <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect?.(lead.id)}
          className="rounded border-[#D0D5DD] text-[#2563EB] focus:ring-[#2563EB] h-4 w-4 cursor-pointer"
        />
      </td>

      {/* Lead name + email */}
      <td className="px-4 py-3 min-w-[180px]">
        <p className="text-sm font-medium text-[#111827] leading-tight hover:text-[#2563EB]">
          {lead.name}
        </p>
        <p className="text-xs text-[#667085] mt-0.5 truncate max-w-[200px]">
          {lead.email}
        </p>
      </td>

      {/* Company */}
      <td className="px-4 py-3 text-sm text-[#374151]">
        {lead.company ? (
          <span className="truncate block max-w-[140px]">{lead.company}</span>
        ) : (
          <span className="text-[#98A2B3]">—</span>
        )}
      </td>

      {/* AI Score */}
      <td className="px-4 py-3">
        <ScoreIndicator score={lead.ai_score} />
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <PriorityBadge priority={lead.priority} />
      </td>

      {/* Intent */}
      <td className="px-4 py-3 text-sm text-[#667085] max-w-[200px]">
        {lead.intent ? truncate(lead.intent, 40) : <span className="text-[#98A2B3]">—</span>}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={lead.is_spam ? 'spam' : (lead.contact_status ?? 'pending')} />
      </td>

      {/* Email */}
      <td className="px-4 py-3">
        {lead.email_sent ? (
          <span className="text-xs text-[#15803D] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Sent
          </span>
        ) : (
          <span className="text-xs text-[#98A2B3]">Not sent</span>
        )}
      </td>

      {/* Created */}
      <td className="px-4 py-3 text-xs text-[#98A2B3] whitespace-nowrap">
        {formatRelativeTime(lead.created_at)}
      </td>

      {/* Quick Action Buttons */}
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onEdit?.(lead)}
            title="Edit Lead"
            className="p-1.5 text-xs text-[#4B5563] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded border border-[#E4E7EC] hover:border-[#BFDBFE] transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete?.(lead)}
            title="Delete Lead"
            className="p-1.5 text-xs text-[#DC2626] hover:bg-red-50 rounded border border-[#E4E7EC] hover:border-red-200 transition-colors"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}
