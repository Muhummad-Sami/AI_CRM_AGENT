'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadIdRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/leads/${resolvedParams.id}`);
  }, [router, resolvedParams.id]);

  return <div className="p-8 text-xs text-[#667085]">Redirecting to Admin Lead Detail...</div>;
}
