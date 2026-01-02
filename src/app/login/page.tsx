'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1f2e]">
      <div className="w-full max-w-md">
        <GlassCard className="p-8">
          <h1 className="mb-2 text-2xl font-semibold text-white">Forge</h1>
          <p className="mb-6 text-sm text-white/50">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-white/70">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="admin@forge.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-white/70">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="password123"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-4 py-2.5 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-white/5 border border-white/10 p-4 text-xs text-white/50">
            <p className="font-medium mb-2">Login credentials:</p>
            <div className="space-y-1 mt-2">
              <p><span className="text-white/60">Admin:</span> <span className="text-cyan-400 font-semibold">admin@forge.com</span></p>
              <p><span className="text-white/60">Sales:</span> <span className="text-cyan-400 font-semibold">john@forge.com</span></p>
              <p><span className="text-white/60">Marketing:</span> <span className="text-cyan-400 font-semibold">mike@forge.com</span></p>
            </div>
            <p className="mt-2 text-white/40">Password for all: password123</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-white/7 bg-white/8 backdrop-blur-lg shadow-xl shadow-black/25 ${className}`}
    >
      {children}
    </div>
  );
}

