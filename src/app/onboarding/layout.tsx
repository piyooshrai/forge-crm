'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white/90">
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TAF</span>
              </div>
              <h1 className="text-xl font-semibold text-white tracking-tight hidden sm:block">
                The Algorithm&apos;s Forge
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">{userName}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content - full width, no sidebar */}
      <main className="pt-16">
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
      </main>
    </div>
  );
}
