'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/settings');
  }, [router]);

  return <div className="p-8 text-xs text-[#667085]">Redirecting to Admin Settings...</div>;
}
