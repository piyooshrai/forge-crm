'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DISMISS_KEY = 'onboarding-banner-dismissed';

export default function ResumeOnboardingBanner() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === 'true') {
      setLoading(false);
      return;
    }

    // Check onboarding status
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/onboarding');
        const data = await res.json();

        // Show banner if not completed AND has started (step > 0)
        if (res.ok && !data.completed && data.step > 0) {
          setShowBanner(true);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setShowBanner(false);
  };

  const handleResume = () => {
    router.push('/onboarding');
  };

  if (loading || !showBanner) {
    return null;
  }

  return (
    <div className="bg-cyan-500/10 border-b border-cyan-500/20">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-white/80">
              You haven&apos;t finished onboarding.{' '}
              <span className="text-white/50">Pick up where you left off.</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResume}
              className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-sm font-medium text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              Resume
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white/60 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
