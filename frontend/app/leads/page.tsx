'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/leads');
  }, [router]);

  return <div className="p-8 text-xs text-[#667085]">Redirecting to Admin Leads Pipeline...</div>;
}
