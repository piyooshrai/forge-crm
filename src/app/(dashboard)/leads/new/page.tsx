'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewLeadPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to leads page - new leads are created via modal
    router.replace('/leads');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-white/60">Redirecting...</p>
    </div>
  );
}
