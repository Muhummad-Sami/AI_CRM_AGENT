'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { checkBackendHealth } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';

// ---- Inline SVG icons ----

function IconDashboard({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
}

function IconUsers({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1.5 13.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" />
      <circle cx="11.5" cy="5.5" r="2" />
      <path d="M13.5 13.5c0-1.934-1.343-3.563-3.167-4.1" />
    </svg>
  );
}

function IconCheckCircle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5 8l2 2 4-4" />
    </svg>
  );
}

function IconMail({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 5l6.5 4.5L14.5 5" />
    </svg>
  );
}

function IconXCircle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
    </svg>
  );
}

function IconSettings({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v1.25M8 13.25V14.5M1.5 8h1.25M13.25 8H14.5M3.2 3.2l.884.884M11.916 11.916l.884.884M12.8 3.2l-.884.884M4.084 11.916l-.884.884" />
    </svg>
  );
}


function IconLogout({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3H3.5a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 3.5 13H6M10.5 11.5L14 8l-3.5-3.5M14 8H6" />
    </svg>
  );
}

// ---- BackendStatus ----

function BackendStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    void checkBackendHealth().then(setConnected);
    const interval = setInterval(() => {
      void checkBackendHealth().then(setConnected);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300"
        style={{
          backgroundColor:
            connected === null ? '#98A2B3' : connected ? '#16A34A' : '#DC2626',
        }}
      />
      <span className="text-[11px] text-[#98A2B3]">
        {connected === null ? 'Checking…' : connected ? 'API Connected' : 'API Disconnected'}
      </span>
    </div>
  );
}

// ---- NavLink with proper active/hover styling ----

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
  indent?: boolean;
}

function NavLink({ href, label, icon, active, onClick, indent = false }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'group flex items-center gap-2.5 rounded-md text-sm w-full transition-all duration-150 select-none',
        indent ? 'px-3 py-1.5 ml-1' : 'px-3 py-2',
        active
          ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold shadow-[inset_2px_0_0_#2563EB]'
          : 'text-[#667085] hover:bg-[#F3F4F6] hover:text-[#111827]',
      ].join(' ')}
    >
      <span
        className={[
          'flex-shrink-0 transition-colors duration-150',
          active ? 'text-[#2563EB]' : 'text-[#9CA3AF] group-hover:text-[#374151]',
        ].join(' ')}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2563EB] flex-shrink-0" />
      )}
    </Link>
  );
}

// ---- Main Sidebar content (needs useSearchParams so wrapped in Suspense) ----

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const { user, logout } = useAuth();

  const isActive = {
    dashboard: pathname === '/admin',
    allLeads: pathname === '/admin/leads' && !statusParam,
    qualified: pathname === '/admin/leads' && statusParam === 'qualified',
    contacted: pathname === '/admin/leads' && statusParam === 'contacted',
    rejected: pathname === '/admin/leads' && statusParam === 'rejected',
    settings: pathname.startsWith('/admin/settings'),
  };

  return (
    <aside className="flex flex-col h-full bg-white border-r border-[#E4E7EC]" style={{ width: '240px' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#E4E7EC] flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#2563EB]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10l3-3 2 2 5-6" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <span className="font-bold text-[#111827] text-sm tracking-tight block leading-tight">AI CRM</span>
          <span className="text-[10px] text-[#98A2B3] leading-tight">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

        {/* Main section */}
        <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-[#C8CFDA]">
          Main
        </p>

        <NavLink
          href="/admin"
          label="Dashboard"
          icon={<IconDashboard />}
          active={isActive.dashboard}
          onClick={onClose}
        />

        {/* Leads section */}
        <div className="pt-3">
          <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-[#C8CFDA]">
            Leads
          </p>
          <div className="space-y-0.5">
            <NavLink
              href="/admin/leads"
              label="All Leads"
              icon={<IconUsers />}
              active={isActive.allLeads}
              onClick={onClose}
            />
            <NavLink
              href="/admin/leads?status=qualified"
              label="Qualified"
              icon={<IconCheckCircle />}
              active={isActive.qualified}
              onClick={onClose}
              indent
            />
            <NavLink
              href="/admin/leads?status=contacted"
              label="Contacted"
              icon={<IconMail />}
              active={isActive.contacted}
              onClick={onClose}
              indent
            />
            <NavLink
              href="/admin/leads?status=rejected"
              label="Rejected"
              icon={<IconXCircle />}
              active={isActive.rejected}
              onClick={onClose}
              indent
            />
          </div>
        </div>

        {/* System section */}
        <div className="pt-3">
          <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-[#C8CFDA]">
            System
          </p>
          <NavLink
            href="/admin/settings"
            label="Settings"
            icon={<IconSettings />}
            active={isActive.settings}
            onClick={onClose}
          />
        </div>
      </nav>

      {/* Footer: user info + status + logout */}
      <div className="border-t border-[#E4E7EC] p-3 space-y-2 flex-shrink-0">
        {/* User pill */}
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-[#F7F8FA] rounded-md">
            <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
              {(user.name || user.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#111827] truncate leading-tight">
                {user.name || 'Admin'}
              </p>
              <p className="text-[10px] text-[#98A2B3] truncate leading-tight">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <BackendStatus />

        {/* Logout button */}
        {user && (
          <button
            onClick={() => { void logout(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100 hover:border-red-200 rounded-md transition-all duration-150 cursor-pointer group"
          >
            <IconLogout />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}

// ---- Main Sidebar component ----

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30" style={{ width: '240px' }}>
        <Suspense fallback={null}>
          <SidebarContent onClose={closeMobile} />
        </Suspense>
      </div>

      {/* Mobile: hamburger button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-3">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-md bg-white border border-[#E4E7EC] text-[#667085] hover:bg-[#F7F8FA] hover:text-[#111827] transition-all duration-150 shadow-sm"
          aria-label="Toggle menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {mobileOpen
              ? <><path d="M3 3l10 10M13 3L3 13" /></>
              : <><path d="M2 4h12M2 8h12M2 12h12" /></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onClick={closeMobile}
          />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 z-50 shadow-xl" style={{ width: '240px' }}>
            <Suspense fallback={null}>
              <SidebarContent onClose={closeMobile} />
            </Suspense>
          </div>
        </>
      )}
    </>
  );
}
