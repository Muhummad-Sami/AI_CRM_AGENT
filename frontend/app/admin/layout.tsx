'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage) {
      // Hard redirect so browser history cannot be used to bypass auth
      window.location.replace('/admin/login');
    }
  }, [loading, isAuthenticated, isLoginPage]);

  // If rendering the login page, render cleanly without sidebar
  if (isLoginPage) {
    // While still checking session, show nothing to avoid flash
    if (loading) return null;
    return <>{children}</>;
  }

  // Show loading state while verifying session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="flex items-center gap-2 text-xs text-[#667085]">
          <svg className="animate-spin h-4 w-4 text-[#2563EB]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Verifying Admin Session…
        </div>
      </div>
    );
  }

  // Not authenticated — render nothing (redirect handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex bg-[#F7F8FA]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-[240px]">
        {children}
      </div>
    </div>
  );
}
