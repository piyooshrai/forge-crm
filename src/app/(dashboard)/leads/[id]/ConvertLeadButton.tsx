'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

function canCreateDeal(role: UserRole): boolean {
  return role === UserRole.SALES_REP || role === UserRole.SUPER_ADMIN;
}

export default function ConvertLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  if (!session || !canCreateDeal(session.user.role as UserRole)) {
    return null;
  }

  const handleConvert = async () => {
    if (!confirm('Convert this lead to a deal?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: 'IT_SERVICES' }),
      });

      if (res.ok) {
        const deal = await res.json();
        router.push(`/deals/${deal.id}`);
      } else {
        alert('Failed to convert lead');
      }
    } catch (error) {
      alert('Error converting lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConvert}
      disabled={loading}
      className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:opacity-50"
    >
      {loading ? 'Converting...' : 'Convert to Deal'}
    </button>
  );
}

