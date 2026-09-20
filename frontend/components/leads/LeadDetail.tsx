'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Lead, ContactStatus } from '@/lib/api';
import { updateLeadStatus, requalifyLead, deleteLead } from '@/lib/api';
import { formatDateTime, formatDate, capitalize } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import ScoreIndicator from '@/components/ui/ScoreIndicator';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EditLeadModal from './EditLeadModal';
import type { ToastType } from '@/lib/hooks/useToast';

interface LeadDetailProps {
  lead: Lead;
  onStatusChange?: (updated: Lead) => void;
  addToast?: (message: string, type?: ToastType) => void;
}

function IconBack({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  );
}

function IconCheck({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3.5 3.5L13 4" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TimelineItem({
  label,
  time,
  done,
}: {
  label: string;
  time?: string | null;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
        style={{
          backgroundColor: done ? '#DCFCE7' : '#F3F4F6',
          border: `1px solid ${done ? '#86EFAC' : '#E4E7EC'}`,
        }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l2.5 2.5L10 3" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-sm text-[#374151]">{label}</p>
        {time && (
          <p className="text-xs text-[#98A2B3] mt-0.5">{formatDateTime(time)}</p>
        )}
      </div>
    </div>
  );
}

const ALLOWED_STATUSES: { value: ContactStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'rejected', label: 'Rejected' },
];

export default function LeadDetail({ lead: initialLead, onStatusChange, addToast }: LeadDetailProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [statusLoading, setStatusLoading] = useState(false);
  const [requalifyLoading, setRequalifyLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ContactStatus | null>(null);

  function toast(message: string, type: ToastType = 'info') {
    addToast?.(message, type);
  }

  async function handleStatusChange(newStatus: ContactStatus) {
    if (newStatus === lead.contact_status) return;
    setPendingStatus(newStatus);
    setConfirmOpen(true);
  }

  async function confirmStatusChange() {
    if (!pendingStatus) return;
    setConfirmOpen(false);
    setStatusLoading(true);
    try {
      const result = await updateLeadStatus(lead.id, pendingStatus);
      const updatedLead: Lead = result?.lead ?? { ...lead, contact_status: pendingStatus };
      setLead(updatedLead);
      onStatusChange?.(updatedLead);
      toast(`Status updated to ${capitalize(pendingStatus)}`, 'success');
    } catch {
      toast('Failed to update status. Please try again.', 'error');
    } finally {
      setStatusLoading(false);
      setPendingStatus(null);
    }
  }

  async function handleRequalify() {
    setRequalifyLoading(true);
    try {
      await requalifyLead(lead.id);
      toast('Lead re-qualification started. Refresh to see updated results.', 'info');
    } catch {
      toast('Failed to re-qualify lead.', 'error');
    } finally {
      setRequalifyLoading(false);
    }
  }

  async function handleDeleteLead() {
    setDeleteConfirmOpen(false);
    try {
      await deleteLead(lead.id);
      toast('Lead deleted successfully', 'success');
      router.push('/admin/leads');
    } catch {
      toast('Failed to delete lead.', 'error');
    }
  }

  const analysis = lead.ai_analysis;
  const effectiveStatus = lead.is_spam ? 'spam' : (lead.contact_status ?? 'pending');

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1.5 text-sm text-[#667085] hover:text-[#111827] transition-colors"
        >
          <IconBack />
          Back to All Leads
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-[#374151] hover:text-[#111827] bg-white border border-[#E4E7EC] rounded-md transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            ✏️ Edit Lead
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-red-50 bg-white border border-red-200 rounded-md transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Lead header card */}
      <div className="bg-white border border-[#E4E7EC] rounded-lg p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Identity */}
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-sm font-semibold text-[#2563EB] flex-shrink-0">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#111827] leading-tight">
                  {lead.name}
                </h2>
                {lead.company && (
                  <p className="text-xs text-[#667085]">{lead.company}</p>
                )}
              </div>
            </div>

            <div className="space-y-1 mt-2">
              <p className="text-sm text-[#374151]">
                <span className="text-[#98A2B3] text-xs mr-1.5">Email</span>
                <a
                  href={`mailto:${lead.email}`}
                  className="text-[#2563EB] hover:underline"
                >
                  {lead.email}
                </a>
              </p>
              {lead.phone && (
                <p className="text-sm text-[#374151]">
                  <span className="text-[#98A2B3] text-xs mr-1.5">Phone</span>
                  {lead.phone}
                </p>
              )}
              <p className="text-sm text-[#374151]">
                <span className="text-[#98A2B3] text-xs mr-1.5">Received</span>
                {formatDate(lead.created_at)}
              </p>
            </div>
          </div>

          {/* Badges + Score */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <StatusBadge status={effectiveStatus} />
              <PriorityBadge priority={lead.priority} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#98A2B3]">Score</span>
              <ScoreIndicator score={lead.ai_score} showBar={false} />
              <span className="text-xs text-[#98A2B3]">/ 100</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E4E7EC] flex-wrap">
          {/* Change status */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#98A2B3] mr-1">Set status:</span>
            {ALLOWED_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => void handleStatusChange(s.value)}
                disabled={statusLoading || lead.contact_status === s.value}
                className="px-2.5 py-1 text-xs rounded border transition-colors disabled:opacity-40"
                style={{
                  borderColor: lead.contact_status === s.value ? '#2563EB' : '#E4E7EC',
                  color: lead.contact_status === s.value ? '#2563EB' : '#374151',
                  backgroundColor: lead.contact_status === s.value ? '#EFF6FF' : 'white',
                }}
              >
                {lead.contact_status === s.value && (
                  <span className="mr-1 inline-flex align-middle">
                    <IconCheck />
                  </span>
                )}
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => void handleRequalify()}
            disabled={requalifyLoading}
            className="ml-auto px-3 py-1.5 text-xs border border-[#E4E7EC] rounded-md text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
          >
            {requalifyLoading ? 'Re-qualifying…' : 'Re-qualify'}
          </button>
        </div>
      </div>

      {/* Original message */}
      <div className="bg-white border border-[#E4E7EC] rounded-lg p-5 mb-4">
        <Section title="Original Message">
          <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap bg-[#F7F8FA] border border-[#E4E7EC] rounded-md p-3">
            {lead.message || <span className="text-[#98A2B3]">No message provided.</span>}
          </p>
        </Section>
      </div>

      {/* AI Qualification */}
      <div className="bg-white border border-[#E4E7EC] rounded-lg p-5 mb-4">
        <Section title="AI Qualification">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-xs text-[#98A2B3] mb-0.5">Score</p>
              <ScoreIndicator score={lead.ai_score} showBar />
            </div>
            <div>
              <p className="text-xs text-[#98A2B3] mb-0.5">Priority</p>
              <PriorityBadge priority={lead.priority} />
            </div>
            <div>
              <p className="text-xs text-[#98A2B3] mb-0.5">Intent</p>
              <p className="text-sm text-[#374151]">{lead.intent ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#98A2B3] mb-0.5">Is Spam</p>
              <p className={`text-sm font-medium ${lead.is_spam ? 'text-[#DC2626]' : 'text-[#15803D]'}`}>
                {lead.is_spam ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#98A2B3] mb-0.5">Should Contact</p>
              <p className={`text-sm font-medium ${lead.should_contact ? 'text-[#15803D]' : 'text-[#667085]'}`}>
                {lead.should_contact ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {analysis?.reason && (
            <div>
              <p className="text-xs text-[#98A2B3] mb-1.5">AI Reasoning</p>
              <p className="text-sm text-[#374151] leading-relaxed bg-[#F7F8FA] border border-[#E4E7EC] rounded-md p-3">
                {analysis.reason}
              </p>
            </div>
          )}
        </Section>
      </div>

      {/* AI Response */}
      <div className="bg-white border border-[#E4E7EC] rounded-lg p-5 mb-4">
        <Section title="AI Response">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-[#98A2B3]">Email status:</p>
            {lead.email_sent ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#15803D] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
                Sent
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-[#98A2B3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB] inline-block" />
                Not sent
              </span>
            )}
          </div>

          {lead.ai_response &&
          lead.ai_response !== 'No response should be sent.' ? (
            <p className="text-sm text-[#374151] leading-relaxed bg-[#F7F8FA] border border-[#E4E7EC] rounded-md p-3 whitespace-pre-wrap">
              {lead.ai_response}
            </p>
          ) : (
            <p className="text-sm text-[#98A2B3] italic">
              {lead.is_spam
                ? 'No response was generated — this lead was marked as spam.'
                : 'No response was generated for this lead.'}
            </p>
          )}
        </Section>
      </div>

      {/* Activity timeline */}
      <div className="bg-white border border-[#E4E7EC] rounded-lg p-5">
        <Section title="Activity">
          <div className="space-y-4">
            <TimelineItem
              label="Lead created"
              time={lead.created_at}
              done={true}
            />
            <TimelineItem
              label="AI qualification completed"
              time={lead.created_at}
              done={lead.ai_score != null}
            />
            <TimelineItem
              label="Response generated"
              time={lead.created_at}
              done={!!lead.ai_response && lead.ai_response !== 'No response should be sent.'}
            />
            <TimelineItem
              label="Email sent to lead"
              time={lead.email_sent ? lead.created_at : null}
              done={!!lead.email_sent}
            />
          </div>
        </Section>
      </div>

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={editModalOpen}
        lead={lead}
        onClose={() => setEditModalOpen(false)}
        onSuccess={(updated) => {
          setLead(updated);
          onStatusChange?.(updated);
          toast('Lead details updated successfully!', 'success');
        }}
      />

      {/* Confirm status change dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Change lead status?"
        description={`Are you sure you want to set this lead's status to "${capitalize(pendingStatus ?? '')}"?`}
        confirmLabel="Yes, update"
        onConfirm={() => void confirmStatusChange()}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingStatus(null);
        }}
      />

      {/* Confirm delete lead dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Lead?"
        description={`Are you sure you want to permanently delete lead "${lead.name}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        onConfirm={() => void handleDeleteLead()}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
