'use client';

import { useState, useEffect } from 'react';
import type { Lead, ContactStatus, Priority } from '@/lib/api';
import { updateLead } from '@/lib/api';

interface EditLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void;
}

export default function EditLeadModal({ isOpen, lead, onClose, onSuccess }: EditLeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    contact_status: 'pending' as ContactStatus,
    priority: 'low' as Priority,
    ai_score: 0,
    intent: '',
    message: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        contact_status: (lead.contact_status as ContactStatus) || 'pending',
        priority: (lead.priority as Priority) || 'low',
        ai_score: lead.ai_score ?? 0,
        intent: lead.intent || '',
        message: lead.message || '',
      });
      setError(null);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateLead(lead.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        contact_status: formData.contact_status,
        priority: formData.priority,
        ai_score: Number(formData.ai_score),
        intent: formData.intent || null,
        message: formData.message,
      });

      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update lead';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E4E7EC] rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E7EC]">
          <h3 className="text-base font-bold text-[#111827]">Edit Lead Details</h3>
          <button
            onClick={onClose}
            className="text-[#98A2B3] hover:text-[#111827] text-lg font-bold p-1 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Status</label>
              <select
                value={formData.contact_status}
                onChange={(e) => setFormData({ ...formData, contact_status: e.target.value as ContactStatus })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="pending">Pending</option>
                <option value="qualified">Qualified</option>
                <option value="contacted">Contacted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">AI Score (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.ai_score}
                onChange={(e) => setFormData({ ...formData, ai_score: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Detected Intent</label>
            <input
              type="text"
              value={formData.intent}
              onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Original Message</label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E4E7EC] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#374151] bg-[#F7F8FA] border border-[#E4E7EC] rounded-md hover:bg-[#E4E7EC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
