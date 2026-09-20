'use client';

import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function IconSearch({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10 10l3.5 3.5" />
    </svg>
  );
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-white border-b border-[#E4E7EC] flex-shrink-0 gap-3">
      {/* Left: title & subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-[#111827] leading-tight">
            {title}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#16A34A] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            Live
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-[#667085] mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right: page actions + search */}
      <div className="flex items-center gap-2 flex-wrap">
        {actions}

        {/* Quick Search */}
        <div className="relative hidden md:block">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Quick search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#E4E7EC] rounded-md text-[#111827] placeholder-[#98A2B3] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all w-40"
          />
        </div>
      </div>
    </header>
  );
}
