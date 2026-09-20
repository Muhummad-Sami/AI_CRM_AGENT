'use client';

import { useState } from 'react';
import type { CreateLeadPayload } from '@/lib/api';
import { createLead } from '@/lib/api';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
  const [formData, setFormData] = useState<CreateLeadPayload>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in Name, Email, and Message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createLead(formData);
      onSuccess();
      onClose();
      setFormData({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create lead';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E4E7EC] rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E7EC]">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Add New Lead</h3>
            <p className="text-xs text-[#667085]">Manually add lead & trigger AI qualification</p>
          </div>
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
              <label className="block text-xs font-semibold text-[#374151] mb-1">Lead Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="john@acme.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 123-4567"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Company Name</label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Inquiry / Requirements *</label>
            <textarea
              required
              rows={4}
              placeholder="Enter client inquiry details..."
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
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? 'Creating & Qualifying...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
