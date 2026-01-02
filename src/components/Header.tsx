'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();
  
  // Fallback for demo if session not loaded
  const displayName = session?.user?.name || session?.user?.email || 'Demo User';
  const displayInitial = session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'D';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center">
          <h1 className="text-xl font-semibold text-white tracking-tight">Forge</h1>
        </Link>

        <div className="hidden flex-1 justify-center px-8 md:flex">
          <input
            type="text"
            placeholder="Search deals, contacts, tasks..."
            className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">{displayName}</span>
            <div className="h-8 w-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-xs font-medium text-cyan-400">
                {displayInitial}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

