'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return <div className="p-8 text-xs text-[#667085]">Redirecting to main lead form...</div>;
}