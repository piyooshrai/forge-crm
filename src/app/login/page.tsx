'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  currentMonth: string;
  teamQuotaPercent: number;
  dealsClosedCount: number;
  winRate: number;
  daysLeftInMonth: number;
  hasData: boolean;
}

interface Standing {
  name: string;
  quotaPercent: number;
}

interface Leaderboard {
  standings: Standing[];
  teamAverage: number;
  hasData: boolean;
}

interface MVP {
  name: string;
  role: string;
  quotaPercent: number;
  winRate: number;
  activitiesCount: number;
  staleDealCount: number;
}

interface MVPResponse {
  mvp: MVP | null;
  hasData: boolean;
}

interface UserPreview {
  name: string;
  quotaPercent: number;
  rank: number;
  totalUsers: number;
  hasData: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [mvpData, setMvpData] = useState<MVPResponse | null>(null);
  const [preview, setPreview] = useState<UserPreview | null>(null);

  useEffect(() => {
    fetch('/api/login/stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/login/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {});
    fetch('/api/login/mvp').then(r => r.json()).then(setMvpData).catch(() => {});
  }, []);

  const handleEmailBlur = async () => {
    if (!email) return;
    try {
      const res = await fetch('/api/login/user-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.hasData) setPreview(data);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="p-6 bg-slate-900/50 border border-slate-800">
            <h1 className="text-lg font-bold text-gray-200 mb-1">The Algorithm's Forge</h1>
            <p className="text-xs text-gray-500 mb-6">Sign in to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 placeholder-gray-600 focus:border-slate-600 focus:outline-none"
                  placeholder="you@company.com"
                />
              </div>

              {/* User Preview */}
              {preview && preview.hasData && (
                <div className="p-4 bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-gray-400 mb-2">Welcome back, {preview.name}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Your Progress</span>
                    <span className={`text-2xl font-bold tabular-nums ${
                      preview.quotaPercent >= 100 ? 'text-green-400' :
                      preview.quotaPercent >= 80 ? 'text-gray-300' :
                      preview.quotaPercent < 50 ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {preview.quotaPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">Ranking</span>
                    <span className="text-sm font-bold text-gray-300 tabular-nums">
                      {preview.rank} of {preview.totalUsers}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 placeholder-gray-600 focus:border-slate-600 focus:outline-none"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-slate-700 border border-slate-600 text-sm font-medium text-gray-300 hover:bg-slate-600 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Dashboard */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 border-l border-slate-800">
        <div className="w-full max-w-sm space-y-4">
          {/* Team Performance */}
          <TeamPerformance stats={stats} />

          {/* Individual Standings */}
          <IndividualStandings leaderboard={leaderboard} />

          {/* Weekly MVP */}
          <WeeklyMVP mvpData={mvpData} />
        </div>
      </div>
    </div>
  );
}

function TeamPerformance({ stats }: { stats: Stats | null }) {
  if (!stats || !stats.hasData) {
    return (
      <div className="p-6 bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Team Performance
        </h3>
        <p className="text-xs text-gray-500 mb-4">{stats?.currentMonth || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Quota Achievement</span>
            <span className="text-lg font-bold text-gray-600 tabular-nums">0%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Deals Closed</span>
            <span className="text-lg font-bold text-gray-600 tabular-nums">0</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-slate-800">
          No activity this month.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-800">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Team Performance
      </h3>
      <p className="text-xs text-gray-500 mb-4">{stats.currentMonth}</p>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Quota Achievement</span>
          <span className={`text-lg font-bold tabular-nums ${
            stats.teamQuotaPercent >= 100 ? 'text-green-400' :
            stats.teamQuotaPercent >= 80 ? 'text-gray-300' :
            'text-red-400'
          }`}>
            {stats.teamQuotaPercent}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Deals Closed</span>
          <span className="text-lg font-bold text-gray-300 tabular-nums">
            {stats.dealsClosedCount}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Win Rate</span>
          <span className="text-lg font-bold text-gray-300 tabular-nums">
            {stats.winRate}%
          </span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          <span className="text-sm text-gray-400">Days Remaining</span>
          <span className="text-lg font-bold text-gray-300 tabular-nums">
            {stats.daysLeftInMonth}
          </span>
        </div>
      </div>
    </div>
  );
}

function IndividualStandings({ leaderboard }: { leaderboard: Leaderboard | null }) {
  if (!leaderboard || !leaderboard.hasData || leaderboard.standings.length === 0) {
    return (
      <div className="p-6 bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Individual Standings
        </h3>
        <p className="text-sm text-gray-500">
          No performance data available.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-800">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Individual Standings
      </h3>

      <div className="space-y-2">
        {leaderboard.standings.map((person, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
            <span className="text-sm text-gray-300">
              {idx + 1}. {person.name}
            </span>
            <span className={`text-sm font-bold tabular-nums ${
              person.quotaPercent >= 100 ? 'text-green-400' :
              person.quotaPercent >= 80 ? 'text-gray-300' :
              'text-red-400'
            }`}>
              {person.quotaPercent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Team Average</span>
        <span className="text-sm font-bold text-gray-400 tabular-nums">
          {leaderboard.teamAverage}%
        </span>
      </div>
    </div>
  );
}

function WeeklyMVP({ mvpData }: { mvpData: MVPResponse | null }) {
  if (!mvpData || !mvpData.hasData || !mvpData.mvp) {
    return (
      <div className="p-6 bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Last Week's Top Performer
        </h3>
        <p className="text-sm text-gray-500">
          No standout performer last week.
        </p>
      </div>
    );
  }

  const mvp = mvpData.mvp;

  return (
    <div className="p-6 bg-slate-900/50 border border-slate-800">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Last Week's Top Performer
      </h3>

      <p className="text-lg font-bold text-gray-200 mb-1">{mvp.name}</p>
      <p className="text-xs text-gray-500 mb-4">{mvp.role}</p>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Quota Achievement</span>
          <span className="text-sm font-bold text-gray-300 tabular-nums">
            {mvp.quotaPercent}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Win Rate</span>
          <span className="text-sm font-bold text-gray-300 tabular-nums">
            {mvp.winRate}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Activities Logged</span>
          <span className="text-sm font-bold text-gray-300 tabular-nums">
            {mvp.activitiesCount}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Stale Deals</span>
          <span className={`text-sm font-bold tabular-nums ${
            mvp.staleDealCount === 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {mvp.staleDealCount}
          </span>
        </div>
      </div>
    </div>
  );
}
