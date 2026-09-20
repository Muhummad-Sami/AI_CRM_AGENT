'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import ScoreIndicator from '@/components/ui/ScoreIndicator';
import Toast from '@/components/ui/Toast';
import { createLead, type CreateLeadPayload, type CreateLeadResponse } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
import { supabase } from '@/lib/supabase';

const PRESETS = [
  {
    label: '🚀 High-Intent Enterprise Demo',
    payload: {
      name: 'Sarah Connor',
      email: 'sarah.connor@cyberdyne.com',
      phone: '+1 (555) 234-5678',
      company: 'Cyberdyne Systems',
      message: 'We are looking to roll out an AI CRM solution for our 250-person sales team next month. We have an approved budget of $50k/year. Can we schedule a demo this Thursday at 10 AM EST?',
    },
  },
  {
    label: '💡 Medium-Intent Pricing Query',
    payload: {
      name: 'Marcus Vance',
      email: 'm.vance@apexlogistics.io',
      phone: '+1 (555) 876-5432',
      company: 'Apex Logistics',
      message: 'Interested in your API integration capabilities for lead routing. What are your standard pricing tiers for high-volume webhook ingestion?',
    },
  },
  {
    label: '❓ Low-Intent Inquiry',
    payload: {
      name: 'Alex Rivera',
      email: 'arivera99@gmail.com',
      phone: '',
      company: '',
      message: 'Hey, do you guys have a free trial or student discount available?',
    },
  },
  {
    label: '🚫 Spam Bot Test',
    payload: {
      name: 'Crypto Gainz',
      email: 'bot99283@cheapcrypto.biz',
      phone: '',
      company: 'Crypto Boost Inc',
      message: 'BUY BITCOIN FAST 100x GUARANTEED RETURN CLICK HERE HTTP://SPAM-LINK.RU NOW!!!',
    },
  },
];

export default function CustomerLandingPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [formData, setFormData] = useState<CreateLeadPayload>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateLeadResponse | null>(null);

  useEffect(() => {
    // When on the public lead form, ensure any existing admin session is cleared
    void supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fillPreset = (presetPayload: CreateLeadPayload) => {
    setFormData(presetPayload);
    setResult(null);
    addToast('Sample test payload loaded!', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      addToast('Please fill out Name, Email, and Message.', 'error');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await createLead(formData);
      setResult(res);
      addToast('Inquiry submitted & qualified by AI!', 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed';
      addToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
    });
    setResult(null);
  };

  const ai = result?.ai_result;

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      {/* Clean Public Top Header */}
      <header className="bg-white border-b border-[#E4E7EC] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 10l3-3 2 2 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-[#111827] text-base tracking-tight">
            AI CRM Agent
          </span>
        </div>

        {/* Clean Admin Dashboard Button Only */}
        <div>
          <Link
            href="/admin/login"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Admin Portal</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 12l4-4-4-4" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main Responsive Customer Form Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            ✨ Instant AI Qualification Enabled
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Get in Touch With Our Sales & Support Team
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
            Fill out the form below. Our AI agent will immediately analyze your inquiry, calculate intent & lead priority score, and draft a response.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-4 shadow-xs">
          <p className="text-xs font-medium text-[#374151] mb-2 flex items-center gap-1.5">
            <span>🧪 Try 1-Click Test Presets:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => fillPreset(preset.payload)}
                className="px-3 py-1.5 text-xs bg-[#F7F8FA] hover:bg-[#EFF6FF] border border-[#E4E7EC] hover:border-[#BFDBFE] rounded-lg text-[#1E3A8A] font-medium transition-all shadow-xs cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form + Realtime AI Feedback Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Responsive Intake Form */}
          <div className="lg:col-span-7 bg-white border border-[#E4E7EC] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3 mb-4">
              <h2 className="text-sm font-semibold text-[#111827]">
                Customer Inquiry Form
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#667085] hover:text-[#111827] underline"
              >
                Clear form
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="sarah@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">
                    Phone Number <span className="text-[#98A2B3] text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">
                    Company Name <span className="text-[#98A2B3] text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    placeholder="Acme Systems"
                    value={formData.company || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  How can we help you? <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Describe your inquiry, project requirements, or question…"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-[#E4E7EC] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing with Gemini AI…
                  </>
                ) : (
                  'Submit Lead Inquiry'
                )}
              </button>
            </form>
          </div>

          {/* Realtime AI Feedback Panel */}
          <div className="lg:col-span-5 flex flex-col h-full">
            {submitting ? (
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center mb-3 text-[#2563EB] animate-pulse text-xl">
                  🤖
                </div>
                <h4 className="text-sm font-semibold text-[#111827]">
                  Gemini AI Qualifying Lead…
                </h4>
                <p className="text-xs text-[#667085] mt-1 max-w-xs">
                  Parsing intent, calculating lead score, and drafting email response…
                </p>
              </div>
            ) : result && ai ? (
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 flex-1 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3">
                  <h4 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    AI Qualification Results
                  </h4>
                  <StatusBadge status={ai.is_spam ? 'spam' : ai.should_contact ? 'qualified' : 'rejected'} />
                </div>

                <div className="grid grid-cols-2 gap-3 bg-[#F7F8FA] p-3 rounded-md border border-[#E4E7EC]">
                  <div>
                    <span className="text-[11px] text-[#667085] uppercase tracking-wide block mb-0.5">
                      AI Lead Score
                    </span>
                    <ScoreIndicator score={ai.score} showBar />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#667085] uppercase tracking-wide block mb-0.5">
                      Priority
                    </span>
                    <PriorityBadge priority={ai.priority} />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#374151] block mb-1">
                    Detected Intent
                  </span>
                  <p className="text-xs text-[#4B5563] bg-[#F9FAFB] p-2.5 rounded border border-[#E4E7EC]">
                    {ai.intent || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#374151] block mb-1">
                    AI Rationale
                  </span>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    {ai.reason}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#374151] block mb-1">
                    Auto-Response Preview
                  </span>
                  <p className="text-xs text-[#374151] italic bg-[#EFF6FF] p-2.5 rounded border border-[#BFDBFE] whitespace-pre-wrap">
                    {ai.response}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between text-[11px] text-[#667085]">
                  <span>{result.email_sent ? '✉️ Email sent to lead' : '⚠️ No email auto-sent'}</span>
                  <Link href="/admin/login" className="text-[#2563EB] font-medium hover:underline">
                    View in Admin Dashboard →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 flex-1 flex flex-col items-center justify-center text-center text-[#667085]">
                <div className="w-10 h-10 rounded-full bg-[#F7F8FA] border border-[#E4E7EC] flex items-center justify-center mb-3 text-lg">
                  📋
                </div>
                <h4 className="text-sm font-medium text-[#374151]">
                  Awaiting Lead Submission
                </h4>
                <p className="text-xs text-[#98A2B3] mt-1 max-w-xs">
                  Fill out the form or click a sample preset above to see real-time AI qualification results.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-[#E4E7EC] py-4 text-center text-xs text-[#98A2B3]">
        AI CRM Agent &copy; {new Date().getFullYear()} — Lead Qualification & Real-Time Intelligence Engine
      </footer>

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}