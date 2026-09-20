'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatCard from '@/components/leads/StatCard';
import LeadTable from '@/components/leads/LeadTable';
import CreateLeadModal from '@/components/leads/CreateLeadModal';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Toast from '@/components/ui/Toast';
import { useLeads } from '@/lib/hooks/useLeads';
import { useToast } from '@/lib/hooks/useToast';
import { exportLeadsCsv } from '@/lib/api';

export default function ProtectedAdminDashboard() {
  // 5-second automatic real-time background polling
  const { leads, loading, error, refresh, lastUpdated } = useLeads(5000);
  const { toasts, addToast, removeToast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.should_contact === true || l.contact_status === 'qualified');
  const contactedLeads = leads.filter((l) => l.contact_status === 'contacted');
  const spamLeads = leads.filter((l) => l.is_spam === true || l.contact_status === 'spam');
  const pendingLeads = leads.filter((l) => !l.contact_status || l.contact_status === 'pending');
  const rejectedLeads = leads.filter((l) => l.contact_status === 'rejected');

  const qualificationRate = totalLeads > 0 ? Math.round((qualifiedLeads.length / totalLeads) * 100) : 0;
  const contactedRate = totalLeads > 0 ? Math.round((contactedLeads.length / totalLeads) * 100) : 0;

  const handleRefresh = async () => {
    await refresh();
    addToast('Dashboard data refreshed', 'info');
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

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header
        title="Admin Dashboard"
        subtitle="Live lead generation, AI qualification, and sales outreach analytics"
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

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
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

        {/* Top KPI Cards */}
        {loading ? (
          <LoadingSkeleton type="stats" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Leads"
              value={totalLeads}
              description="All captured submissions"
              trend={totalLeads > 0 ? `${totalLeads} total` : undefined}
            />
            <StatCard
              title="Qualified Leads"
              value={qualifiedLeads.length}
              description={`${qualificationRate}% qualification rate`}
              trend={`${qualificationRate}%`}
            />
            <StatCard
              title="Contacted Leads"
              value={contactedLeads.length}
              description={`${contactedRate}% outreach rate`}
              trend={`${contactedRate}%`}
            />
            <StatCard
              title="Spam Filtered"
              value={spamLeads.length}
              description="Automatically flagged by AI"
            />
          </div>
        )}

        {/* Middle Section: Distribution & Insights */}
        {!loading && totalLeads > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Status Breakdown Bar */}
            <div className="lg:col-span-2 bg-white border border-[#E4E7EC] rounded-lg p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[#111827]">
                  Lead Status Breakdown
                </h2>
                {lastUpdated && (
                  <span className="text-[11px] text-[#98A2B3]">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#667085] mb-4">
                Distribution of incoming leads across pipeline stages
              </p>

              {/* Progress stack */}
              <div className="w-full h-3 bg-[#F0F2F5] rounded-full overflow-hidden flex mb-4">
                <div
                  style={{ width: `${(qualifiedLeads.length / totalLeads) * 100}%` }}
                  className="bg-[#2563EB] h-full"
                  title="Qualified"
                />
                <div
                  style={{ width: `${(contactedLeads.length / totalLeads) * 100}%` }}
                  className="bg-[#16A34A] h-full"
                  title="Contacted"
                />
                <div
                  style={{ width: `${(pendingLeads.length / totalLeads) * 100}%` }}
                  className="bg-[#D97706] h-full"
                  title="Pending"
                />
                <div
                  style={{ width: `${(rejectedLeads.length / totalLeads) * 100}%` }}
                  className="bg-[#98A2B3] h-full"
                  title="Rejected"
                />
                <div
                  style={{ width: `${(spamLeads.length / totalLeads) * 100}%` }}
                  className="bg-[#DC2626] h-full"
                  title="Spam"
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <span className="text-[#667085]">Qualified:</span>
                  <span className="font-semibold text-[#111827]">{qualifiedLeads.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                  <span className="text-[#667085]">Contacted:</span>
                  <span className="font-semibold text-[#111827]">{contactedLeads.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <span className="text-[#667085]">Pending:</span>
                  <span className="font-semibold text-[#111827]">{pendingLeads.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#98A2B3]" />
                  <span className="text-[#667085]">Rejected:</span>
                  <span className="font-semibold text-[#111827]">{rejectedLeads.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  <span className="text-[#667085]">Spam:</span>
                  <span className="font-semibold text-[#111827]">{spamLeads.length}</span>
                </div>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-white border border-[#E4E7EC] rounded-lg p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#111827] mb-1">
                  AI Lead Intelligence
                </h2>
                <p className="text-xs text-[#667085] mb-4">
                  Gemini qualification engine active
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#667085]">Auto-qualified:</span>
                    <span className="font-mono font-medium text-[#111827]">
                      {qualifiedLeads.length} / {totalLeads}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#667085]">Avg AI Intent Confidence:</span>
                    <span className="font-mono font-medium text-[#16A34A]">High</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#667085]">Email Auto-Responder:</span>
                    <span className="font-mono font-medium text-[#2563EB]">Active</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E4E7EC] text-xs text-[#667085]">
                Monitoring incoming inquiries from customer form.
              </div>
            </div>
          </div>
        )}

        {/* Recent Leads Table Container */}
        <div className="bg-white border border-[#E4E7EC] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E7EC]">
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">
                Recent Lead Inquiries
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Latest leads received and scored by AI
              </p>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors"
            >
              View all leads
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 12l4-4-4-4" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton type="table" rows={5} />
          ) : (
            <LeadTable leads={recentLeads} onRefresh={refresh} />
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
