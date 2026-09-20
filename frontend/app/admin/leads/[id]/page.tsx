'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import LeadDetail from '@/components/leads/LeadDetail';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Toast from '@/components/ui/Toast';
import { fetchLeads, type Lead } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';

export default function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    async function loadLead() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLeads();
        const found = data.leads.find((l) => l.id === leadId);
        if (!found) {
          setError(`Lead with ID "${leadId}" was not found.`);
        } else {
          setLead(found);
        }
      } catch {
        setError('Failed to load lead details from backend.');
      } finally {
        setLoading(false);
      }
    }

    void loadLead();
  }, [leadId]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header
        title={lead ? lead.name : 'Lead Details'}
        subtitle={lead?.company || 'Detailed AI qualification & communication details'}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="max-w-3xl space-y-4">
            <LoadingSkeleton type="stats" />
            <LoadingSkeleton type="table" rows={4} />
          </div>
        ) : error ? (
          <div className="max-w-xl p-6 bg-white border border-[#E4E7EC] rounded-lg">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 mb-4">
              {error}
            </div>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline"
            >
              ← Back to all leads
            </Link>
          </div>
        ) : lead ? (
          <LeadDetail
            lead={lead}
            onStatusChange={(updatedLead) => setLead(updatedLead)}
            addToast={addToast}
          />
        ) : null}
      </main>

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}
