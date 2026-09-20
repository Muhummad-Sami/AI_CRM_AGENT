'use client';

import { useState } from 'react';
import type { Lead, ContactStatus } from '@/lib/api';
import { batchUpdateLeadStatus, batchDeleteLeads, deleteLead } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EditLeadModal from './EditLeadModal';
import LeadRow from './LeadRow';

interface LeadTableProps {
  leads: Lead[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRefresh?: () => void;
  limit?: number;
}

export default function LeadTable({
  leads,
  loading,
  error,
  onRetry,
  onRefresh,
  limit,
}: LeadTableProps) {
  const displayLeads = limit ? leads.slice(0, limit) : leads;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const allSelected =
    displayLeads.length > 0 && selectedIds.length === displayLeads.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayLeads.map((l) => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Batch Status Update
  const handleBatchStatus = async (status: ContactStatus) => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await batchUpdateLeadStatus(selectedIds, status);
      setSelectedIds([]);
      onRefresh?.();
    } catch {
      alert('Failed to update lead status');
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Delete Confirmation
  const confirmBatchDelete = async () => {
    setBatchDeleteOpen(false);
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await batchDeleteLeads(selectedIds);
      setSelectedIds([]);
      onRefresh?.();
    } catch {
      alert('Failed to delete selected leads');
    } finally {
      setActionLoading(false);
    }
  };

  // Single Delete Confirmation
  const confirmSingleDelete = async () => {
    if (!deletingLead) return;
    const targetId = deletingLead.id;
    setDeletingLead(null);
    setActionLoading(true);
    try {
      await deleteLead(targetId);
      onRefresh?.();
    } catch {
      alert('Failed to delete lead');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg overflow-hidden flex flex-col">
      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-[#1E40AF]">
            <span>✓ {selectedIds.length} lead(s) selected</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#667085]">Batch Status:</span>
            <button
              onClick={() => handleBatchStatus('qualified')}
              disabled={actionLoading}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#16A34A] border border-[#86EFAC] rounded font-medium transition-colors"
            >
              Qualified
            </button>
            <button
              onClick={() => handleBatchStatus('contacted')}
              disabled={actionLoading}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#2563EB] border border-[#BFDBFE] rounded font-medium transition-colors"
            >
              Contacted
            </button>
            <button
              onClick={() => handleBatchStatus('rejected')}
              disabled={actionLoading}
              className="px-2.5 py-1 bg-white hover:bg-gray-100 text-[#667085] border border-[#E4E7EC] rounded font-medium transition-colors"
            >
              Rejected
            </button>
            <button
              onClick={() => setBatchDeleteOpen(true)}
              disabled={actionLoading}
              className="px-2.5 py-1 bg-white hover:bg-red-50 text-[#DC2626] border border-red-200 rounded font-medium transition-colors ml-2"
            >
              🗑️ Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-[#667085] hover:text-[#111827] underline ml-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E4E7EC] bg-[#F9FAFB]">
              <th className="px-4 py-2.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-[#D0D5DD] text-[#2563EB] focus:ring-[#2563EB] h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap min-w-[180px]">
                Lead
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap">
                Company
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap">
                Score
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap">
                Priority
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap max-w-[200px]">
                Intent
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap">
                Email
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap">
                Created
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-[#667085] uppercase tracking-wide whitespace-nowrap text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <TableSkeleton rows={6} />
            ) : error ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <p className="text-sm text-[#667085] mb-3">{error}</p>
                  <button
                    onClick={onRetry}
                    className="px-3 py-1.5 text-sm border border-[#E4E7EC] rounded-md text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : displayLeads.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-[#374151] mb-1">No leads found</p>
                  <p className="text-xs text-[#98A2B3]">
                    New leads will appear here when submitted or added by admin.
                  </p>
                </td>
              </tr>
            ) : (
              displayLeads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isSelected={selectedIds.includes(lead.id)}
                  onToggleSelect={toggleSelect}
                  onEdit={(l) => setEditingLead(l)}
                  onDelete={(l) => setDeletingLead(l)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={!!editingLead}
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSuccess={() => onRefresh?.()}
      />

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingLead}
        title="Delete Lead?"
        description={`Are you sure you want to permanently delete lead "${deletingLead?.name}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        onConfirm={() => void confirmSingleDelete()}
        onCancel={() => setDeletingLead(null)}
      />

      {/* Batch Delete Confirmation Dialog */}
      <ConfirmDialog
        open={batchDeleteOpen}
        title={`Delete ${selectedIds.length} Selected Lead(s)?`}
        description="Are you sure you want to delete all selected leads? This action cannot be undone."
        confirmLabel="Yes, Delete All"
        onConfirm={() => void confirmBatchDelete()}
        onCancel={() => setBatchDeleteOpen(false)}
      />
    </div>
  );
}
