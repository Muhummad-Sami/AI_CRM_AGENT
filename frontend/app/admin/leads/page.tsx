'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import LeadTable from '@/components/leads/LeadTable';
import LeadFilters from '@/components/leads/LeadFilters';
import CreateLeadModal from '@/components/leads/CreateLeadModal';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Toast from '@/components/ui/Toast';
import { useLeads } from '@/lib/hooks/useLeads';
import { useToast } from '@/lib/hooks/useToast';
import { exportLeadsCsv, type Lead } from '@/lib/api';

function AdminLeadsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const { leads, loading, error, refresh } = useLeads(5000);
  const { toasts, addToast, removeToast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead: Lead) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = lead.name.toLowerCase().includes(q);
          const matchEmail = lead.email.toLowerCase().includes(q);
          const matchCompany = (lead.company || '').toLowerCase().includes(q);
          const matchIntent = (lead.intent || '').toLowerCase().includes(q);
          const matchMessage = lead.message.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchCompany && !matchIntent && !matchMessage) {
            return false;
          }
        }

        if (statusFilter !== 'all') {
          if (statusFilter === 'spam') {
            if (!lead.is_spam && lead.contact_status !== 'spam') return false;
          } else if (statusFilter === 'qualified') {
            if (lead.contact_status !== 'qualified' && !lead.should_contact) return false;
          } else {
            if (lead.contact_status !== statusFilter) return false;
          }
        }

        if (priorityFilter !== 'all') {
          if ((lead.priority || 'low').toLowerCase() !== priorityFilter.toLowerCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (sortBy === 'score_desc') {
          return (b.ai_score ?? 0) - (a.ai_score ?? 0);
        }
        if (sortBy === 'score_asc') {
          return (a.ai_score ?? 0) - (b.ai_score ?? 0);
        }
        return 0;
      });
  }, [leads, search, statusFilter, priorityFilter, sortBy]);

  const handleRefresh = async () => {
    await refresh();
    addToast('Leads list refreshed', 'info');
  };

  const handleExportCsv = async () => {
    try {
      const blob = await exportLeadsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Leads CSV exported successfully!', 'success');
    } catch {
      addToast('Failed to export CSV', 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || priorityFilter !== 'all';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header
        title="All Leads Pipeline"
        subtitle={`Showing ${filteredLeads.length} of ${leads.length} total leads`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <span>+ Add New Lead</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#E4E7EC] rounded-md text-[#374151] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
            >
              📥 Export CSV
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#E4E7EC] rounded-md text-[#111827] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1.5 8a6.5 6.5 0 1 0 1.9-4.6L1.5 5.5M1.5 1.5v4h4" />
              </svg>
              Refresh
            </button>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Error notification */}
        {error && (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <span>{error}</span>
            <button
              onClick={refresh}
              className="px-2.5 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 rounded transition-colors text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <LeadFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReset={clearFilters}
        />

        {/* Active Filter Bar if filters are applied */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between px-3 py-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md text-xs text-[#1E40AF]">
            <span>
              Filtered view ({filteredLeads.length} matches found)
            </span>
            <button
              onClick={clearFilters}
              className="font-medium underline hover:text-[#1E3A8A]"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Table View */}
        <div className="bg-white border border-[#E4E7EC] rounded-lg overflow-hidden">
          {loading ? (
            <LoadingSkeleton type="table" rows={8} />
          ) : (
            <LeadTable leads={filteredLeads} onRefresh={refresh} />
          )}
        </div>
      </main>

      {/* Add Lead Modal */}
      <CreateLeadModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          refresh();
          addToast('New lead created and qualified by AI!', 'success');
        }}
      />

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function AdminLeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#667085]">Loading leads pipeline…</div>}>
      <AdminLeadsContent />
    </Suspense>
  );
}
