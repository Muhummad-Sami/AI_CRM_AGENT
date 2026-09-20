'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Toast from '@/components/ui/Toast';
import { checkBackendHealth, testSmtpConnection } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminSettingsPage() {
  const { toasts, addToast, removeToast } = useToast();
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<boolean | null>(null);

  const [testEmail, setTestEmail] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const testHealth = async () => {
    setChecking(true);
    const ok = await checkBackendHealth();
    setHealthStatus(ok);
    setChecking(false);
    if (ok) {
      addToast('FastAPI Backend ping successful!', 'success');
    } else {
      addToast('Backend ping failed — check if main.py server is running.', 'error');
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) return;
    setSendingTestEmail(true);
    try {
      const res = await testSmtpConnection(testEmail.trim());
      if (res.success) {
        addToast(res.message, 'success');
      } else {
        addToast(res.message, 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send test email';
      addToast(msg, 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <Header
        title="System & AI Settings"
        subtitle="Backend service health, qualification rules, and admin authentication parameters"
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
        {/* Admin User Card */}
        <div className="bg-white border border-[#E4E7EC] rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3 mb-4">
            <h2 className="text-sm font-semibold text-[#111827]">
              Authenticated Session
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
              Active Session
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#98A2B3] block mb-0.5">Admin Email</span>
              <span className="font-semibold text-[#111827]">{user?.email || 'admin@example.com'}</span>
            </div>
            <div>
              <span className="text-[#98A2B3] block mb-0.5">Role</span>
              <span className="font-semibold text-[#111827]">{user?.role || 'Super Admin'}</span>
            </div>
            <div>
              <span className="text-[#98A2B3] block mb-0.5">Session Action</span>
              <button
                onClick={() => { void logout(); }}
                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-medium transition-colors cursor-pointer"
              >
                Logout Session
              </button>
            </div>
          </div>
        </div>

        {/* Backend Health Check */}
        <div className="bg-white border border-[#E4E7EC] rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3 mb-4">
            <h2 className="text-sm font-semibold text-[#111827]">
              FastAPI Backend Service Health
            </h2>
            <button
              onClick={testHealth}
              disabled={checking}
              className="px-3 py-1.5 text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {checking ? 'Pinging…' : 'Ping Backend Server'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor:
                  healthStatus === null
                    ? '#98A2B3'
                    : healthStatus
                    ? '#16A34A'
                    : '#DC2626',
              }}
            />
            <span className="text-xs font-medium text-[#374151]">
              {healthStatus === null
                ? 'Click "Ping Backend Server" to test FastAPI endpoint (http://127.0.0.1:8000/)'
                : healthStatus
                ? 'FastAPI Server connected & healthy (200 OK)'
                : 'Connection failed — backend offline or unreachable'}
            </span>
          </div>
        </div>

        {/* SMTP Email Service Test */}
        <div className="bg-white border border-[#E4E7EC] rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3 mb-4">
            <h2 className="text-sm font-semibold text-[#111827]">
              SMTP Email Integration (Gmail Service)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB]">
              smtp.gmail.com:587
            </span>
          </div>

          <p className="text-xs text-[#667085] mb-4">
            Test sending an automated lead response email to verify your GMAIL_ADDRESS and GMAIL_APP_PASSWORD credentials.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter target email address…"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-[#E4E7EC] rounded-md text-xs focus:outline-none focus:border-[#2563EB]"
            />
            <button
              onClick={handleTestEmail}
              disabled={sendingTestEmail || !testEmail.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sendingTestEmail ? 'Sending…' : 'Send Test Email'}
            </button>
          </div>
        </div>

        {/* AI Model Parameters */}
        <div className="bg-white border border-[#E4E7EC] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#111827] border-b border-[#E4E7EC] pb-3 mb-4">
            AI Qualification Engine Configuration
          </h2>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F7F8FA] p-3 rounded-md border border-[#E4E7EC]">
                <span className="text-[#98A2B3] block mb-1">Model Architecture</span>
                <span className="font-mono font-medium text-[#111827]">Google Gemini 3.5 Flash / Lite</span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-md border border-[#E4E7EC]">
                <span className="text-[#98A2B3] block mb-1">Scoring Threshold</span>
                <span className="font-mono font-medium text-[#16A34A]">≥ 70 Score = High Priority</span>
              </div>
            </div>

            <div className="bg-[#F7F8FA] p-3 rounded-md border border-[#E4E7EC]">
              <span className="text-[#98A2B3] block mb-1">Auto-Response Policy</span>
              <p className="text-[#374151]">
                Generates polite, concise responses for genuine leads without fabricating pricing, commitments, or deadlines. Suppresses responses for spam inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* Database & Stack Info */}
        <div className="bg-white border border-[#E4E7EC] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#111827] border-b border-[#E4E7EC] pb-3 mb-4">
            System Stack & Database Specs
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#98A2B3] block mb-0.5">Database</span>
              <span className="font-medium text-[#111827]">Supabase Postgres</span>
            </div>
            <div>
              <span className="text-[#98A2B3] block mb-0.5">Backend</span>
              <span className="font-medium text-[#111827]">FastAPI + Uvicorn</span>
            </div>
            <div>
              <span className="text-[#98A2B3] block mb-0.5">Frontend</span>
              <span className="font-medium text-[#111827]">Next.js 16 (Turbopack)</span>
            </div>
            <div>
              <span className="text-[#98A2B3] block mb-0.5">Styling</span>
              <span className="font-medium text-[#111827]">Tailwind CSS v4</span>
            </div>
          </div>
        </div>
      </main>

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}
