'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDealPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to deals page - new deals are created via modal
    router.replace('/deals');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-white/60">Redirecting...</p>
    </div>
  );
}
