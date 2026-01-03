'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  currentMonth: string;
  pipelineValue: number;
  teamQuotaPercent: number;
  dealsClosedThisMonth: number;
  winRate: number;
  currentStreak: { type: 'win' | 'loss'; count: number };
  daysLeftInMonth: number;
  hasData: boolean;
}

interface Performer {
  id: string;
  name: string;
  quotaPercent: number;
  quotaActual: number;
  quotaTarget: number;
  rank: number;
}

interface Leaderboard {
  topPerformers: Performer[];
  teamAverage: number;
  daysLeftInMonth: number;
  hasData: boolean;
}

interface RecentWin {
  dealName: string;
  amount: number;
  ownerName: string;
  closedAt: string;
}

interface RecentWins {
  recentWins: RecentWin[];
  hasData: boolean;
}

interface UserPreview {
  name: string;
  quotaPercent: number;
  quotaActual: number;
  quotaTarget: number;
  rank: number;
  totalUsers: number;
  status: 'crushing' | 'on-track' | 'behind' | 'critical';
  daysLeft: number;
  hasData: boolean;
}

interface MVP {
  mvp: {
    name: string;
    role: string;
    quotaPercent: number;
    winRate: number;
    achievements: string[];
  } | null;
  hasData: boolean;
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) return "Still working? That's how winners are made.";
  if (hour >= 6 && hour < 9) return "Early start. Make today count.";
  if (hour >= 9 && hour < 12) return "Morning. Let's dominate.";
  if (hour >= 12 && hour < 17) return "Afternoon. How's your pipeline looking?";
  if (hour >= 17 && hour < 22) return "Evening push. One more call could change everything.";
  return "Late night hustle. Dedication recognized.";
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function getQuote(teamQuotaPercent: number, daysLeft: number): { text: string; author: string | null } {
  if (teamQuotaPercent >= 100) {
    return { text: "Excellence isn't an aspiration. It's the standard.", author: "The Algorithm" };
  }
  if (teamQuotaPercent >= 90) {
    return { text: "Good is the enemy of great. Don't settle.", author: "Jim Collins" };
  }
  if (teamQuotaPercent < 80 && daysLeft < 10) {
    return { text: "When the going gets tough, the tough get going.", author: "Joe Kennedy" };
  }
  if (teamQuotaPercent < 70) {
    return { text: "Winners find a way. Losers find an excuse.", author: null };
  }
  return { text: "Excellence isn't an aspiration. It's the standard at The Algorithm.", author: null };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [recentWins, setRecentWins] = useState<RecentWins | null>(null);
  const [userPreview, setUserPreview] = useState<UserPreview | null>(null);
  const [mvp, setMvp] = useState<MVP | null>(null);

  useEffect(() => {
    fetch('/api/login/stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/login/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {});
    fetch('/api/login/recent-wins').then(r => r.json()).then(setRecentWins).catch(() => {});
    fetch('/api/login/mvp').then(r => r.json()).then(setMvp).catch(() => {});
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
      if (data.hasData) setUserPreview(data);
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

  const statusConfig = {
    crushing: { emoji: '🟢', text: 'Crushing It', color: 'text-green-400', bgColor: 'bg-green-900/20 border-green-700/50', message: 'Keep the momentum!' },
    'on-track': { emoji: '🟡', text: 'On Track', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20 border-yellow-700/50', message: '' },
    behind: { emoji: '🔴', text: 'Behind Target', color: 'text-red-400', bgColor: 'bg-red-900/20 border-red-700/50', message: '' },
    critical: { emoji: '🚨', text: 'CRITICAL', color: 'text-red-600', bgColor: 'bg-red-900/40 border-red-600', message: 'Urgent action required TODAY.' },
  };

  const quote = stats ? getQuote(stats.teamQuotaPercent, stats.daysLeftInMonth) : null;

  return (
    <div className="flex min-h-screen bg-[#1a1f2e]">
      {/* Left side - Login form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <p className="text-sm text-gray-400 text-center mb-4">{getTimeBasedGreeting()}</p>

          <GlassCard className="p-8">
            <h1 className="mb-2 text-2xl font-semibold text-white">The Algorithm's Forge</h1>
            <p className="mb-6 text-sm text-white/50">Sign in to your account</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-white/70">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                  placeholder="admin@forge.com"
                />
              </div>

              {/* User Preview */}
              {userPreview && userPreview.hasData && (
                <div className={`p-4 rounded-lg border ${statusConfig[userPreview.status].bgColor}`}>
                  <p className="text-lg font-bold text-white">Welcome back, {userPreview.name}</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-sm text-gray-400">Your Progress:</p>
                      <p className="text-3xl font-bold text-white">{userPreview.quotaPercent.toFixed(0)}%</p>
                      <p className="text-sm text-gray-400">
                        ${userPreview.quotaActual.toLocaleString()} / ${userPreview.quotaTarget.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-400">Rank</p>
                        <p className="font-bold text-white">
                          {userPreview.rank === 1 ? '🥇 ' : userPreview.rank === 2 ? '🥈 ' : userPreview.rank === 3 ? '🥉 ' : ''}
                          {userPreview.rank} of {userPreview.totalUsers}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className={`font-bold ${statusConfig[userPreview.status].color}`}>
                          {statusConfig[userPreview.status].emoji} {statusConfig[userPreview.status].text}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${statusConfig[userPreview.status].color}`}>
                      {statusConfig[userPreview.status].message || `${userPreview.daysLeft} days left to close the gap.`}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="mb-1 block text-sm text-white/70">Password</label>
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
          </GlassCard>

          {quote && (
            <div className="text-center mt-6">
              <p className="text-sm italic text-gray-400">"{quote.text}"</p>
              {quote.author && <p className="text-xs text-gray-500 mt-1">- {quote.author}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Dashboard */}
      <div className="hidden lg:flex lg:w-[55%] flex-col p-8 overflow-y-auto border-l border-white/10">
        <div className="max-w-xl mx-auto w-full space-y-6">
          {/* Team Stats */}
          {stats && (
            <StatsCard stats={stats} />
          )}

          {/* Leaderboard */}
          {leaderboard && (
            <LeaderboardCard leaderboard={leaderboard} />
          )}

          {/* Recent Wins */}
          {recentWins && (
            <RecentWinsCard recentWins={recentWins} />
          )}

          {/* MVP */}
          {mvp && (
            <MVPCard mvp={mvp} />
          )}

          {/* Days Countdown */}
          {stats && (
            <CountdownCard daysLeft={stats.daysLeftInMonth} />
          )}
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-xl shadow-black/25 ${className}`}>
      {children}
    </div>
  );
}

function StatsCard({ stats }: { stats: Stats }) {
  if (!stats.hasData || stats.dealsClosedThisMonth === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold mb-4 text-white">{stats.currentMonth}</h3>
        <div className="space-y-2 text-gray-400">
          <p>Pipeline Value: $0</p>
          <p>Deals Closed: 0</p>
          <p>Win Rate: 0%</p>
        </div>
        <p className="text-red-400 font-bold mt-4 text-lg">🚨 Zero activity. Zero results. Someone needs to step up.</p>
        <p className="text-cyan-400 font-bold mt-2">New month. Fresh start. Time to dominate.</p>
      </GlassCard>
    );
  }

  const borderColor = stats.teamQuotaPercent >= 100 ? 'border-green-700/50' : stats.teamQuotaPercent >= 80 ? 'border-yellow-700/50' : 'border-red-700/50';
  const titleColor = stats.teamQuotaPercent >= 100 ? 'text-green-400' : stats.teamQuotaPercent >= 80 ? 'text-yellow-400' : 'text-red-400';
  const emoji = stats.teamQuotaPercent >= 100 ? '🟢' : stats.teamQuotaPercent >= 80 ? '🟡' : '🔴';

  return (
    <GlassCard className={`p-6 ${borderColor}`}>
      <h3 className={`text-xl font-bold mb-4 ${titleColor}`}>{stats.currentMonth}</h3>
      <div className="space-y-2">
        <p className={`text-2xl font-bold ${titleColor}`}>Team Quota: {stats.teamQuotaPercent}% {emoji}</p>
        <p className="text-gray-300">Pipeline: ${stats.pipelineValue.toLocaleString()}</p>
        <p className="text-gray-300">Deals Closed: {stats.dealsClosedThisMonth} wins</p>
        <p className="text-gray-300">Win Rate: {stats.winRate}%</p>
        {stats.currentStreak.type === 'win' && stats.currentStreak.count >= 3 && (
          <p className="text-cyan-400 font-bold mt-2">🔥 {stats.currentStreak.count}-day winning streak</p>
        )}
      </div>
      <p className={`${titleColor} font-bold mt-4`}>
        {stats.teamQuotaPercent >= 100 ? 'Exceeding expectations. This is how we operate.' :
         stats.teamQuotaPercent >= 80 ? `On track. ${stats.daysLeftInMonth} days left - push harder.` :
         `🚨 Behind target. ${stats.daysLeftInMonth} days left. Urgent action required.`}
      </p>
    </GlassCard>
  );
}

function LeaderboardCard({ leaderboard }: { leaderboard: Leaderboard }) {
  if (!leaderboard.hasData || leaderboard.topPerformers.length === 0) {
    return (
      <GlassCard className="p-4">
        <h3 className="text-lg font-bold mb-2 text-white">TOP PERFORMERS</h3>
        <p className="text-gray-400 mb-2">No data yet this month.</p>
        <p className="text-cyan-400 font-bold">Be the first name on this board.</p>
        <p className="text-sm text-gray-500 mt-1">Close a deal. Create leads. Make your mark.</p>
      </GlassCard>
    );
  }

  const hasRealPerformance = leaderboard.topPerformers[0]?.quotaPercent > 0;
  if (!hasRealPerformance) {
    return (
      <GlassCard className="p-4 border-red-700/50">
        <h3 className="text-lg font-bold mb-2 text-red-400">TOP PERFORMERS</h3>
        <p className="text-gray-400 mb-2">No movement yet.</p>
        <p className="text-red-400 font-bold text-lg">⚠️ Zero activity. Zero results.</p>
        <p className="text-sm text-gray-400 mt-1">Someone needs to step up. Will it be you?</p>
      </GlassCard>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-bold mb-3 text-white">THIS MONTH'S TOP PERFORMERS</h3>
      <div className="space-y-2">
        {leaderboard.topPerformers.map((p, idx) => (
          <div key={p.id} className="flex justify-between items-center">
            <span className={idx === 0 ? 'text-lg text-white' : 'text-white'}>{medals[idx]} {p.name}</span>
            <span className={`font-bold ${p.quotaPercent >= 100 ? 'text-green-400' : p.quotaPercent >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
              {p.quotaPercent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Team Average:</span>
          <span className="font-bold text-white">{leaderboard.teamAverage}%</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Days Remaining:</span>
          <span className="font-bold text-white">{leaderboard.daysLeftInMonth}</span>
        </div>
      </div>
    </GlassCard>
  );
}

function RecentWinsCard({ recentWins }: { recentWins: RecentWins }) {
  if (!recentWins.hasData || recentWins.recentWins.length === 0) {
    return (
      <GlassCard className="p-6 border-red-700/50">
        <h3 className="text-xl font-bold mb-2 text-red-400">LATEST VICTORIES</h3>
        <p className="text-gray-400 mb-2">No deals closed yet this month.</p>
        <p className="text-red-400 font-bold text-lg">🚨 The scoreboard is empty.</p>
        <p className="text-sm text-gray-400 mt-1">Someone needs to close. Today.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold mb-4 text-white">LATEST VICTORIES</h3>
      <div className="space-y-3">
        {recentWins.recentWins.map((win, idx) => (
          <div key={idx} className="border-l-2 border-cyan-400 pl-3">
            <p className="text-cyan-400 font-bold">🎯 {win.ownerName} closed {win.dealName}</p>
            <p className="text-sm text-gray-400">${win.amount.toLocaleString()} • {formatTimeAgo(win.closedAt)}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function MVPCard({ mvp }: { mvp: MVP }) {
  if (!mvp.hasData || !mvp.mvp) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold mb-4 text-white">LAST WEEK'S MVP</h3>
        <p className="text-gray-400 mb-3">No standout performer last week.</p>
        <div className="p-4 bg-slate-700/30 rounded border border-slate-600">
          <p className="text-lg font-bold text-cyan-400 italic">"Excellence isn't an aspiration. It's the standard."</p>
          <p className="text-sm text-gray-400 mt-2">- The Algorithm</p>
        </div>
        <p className="text-sm text-gray-400 mt-3">Be the first to set the bar. Close deals. Dominate.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 border-cyan-700/50">
      <h3 className="text-xl font-bold mb-4 text-cyan-400">LAST WEEK'S MVP</h3>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center">
          <span className="text-3xl">👑</span>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-cyan-400">{mvp.mvp.name}</p>
          <p className="text-sm text-gray-400">{mvp.mvp.role}</p>
          <div className="mt-4">
            <p className="text-sm font-bold text-gray-300 mb-2">Last Week's Performance:</p>
            <ul className="space-y-1">
              {mvp.mvp.achievements.map((achievement, idx) => (
                <li key={idx} className="text-sm text-gray-300">• {achievement}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div>
              <p className="text-gray-400">Quota</p>
              <p className="text-xl font-bold text-green-400">{mvp.mvp.quotaPercent}%</p>
            </div>
            <div>
              <p className="text-gray-400">Win Rate</p>
              <p className="text-xl font-bold text-cyan-400">{mvp.mvp.winRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function CountdownCard({ daysLeft }: { daysLeft: number }) {
  const now = new Date();
  const month = now.getMonth();
  const quarterEndMonths = [2, 5, 8, 11];
  const isLastWeekOfQuarter = quarterEndMonths.includes(month) && daysLeft <= 7;

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-bold mb-2 text-white">TIME REMAINING</h3>
      <p className="text-4xl font-bold text-cyan-400">{daysLeft}</p>
      <p className="text-sm text-gray-400">days until month end</p>
      {isLastWeekOfQuarter && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded animate-pulse">
          <p className="text-sm font-bold text-red-400">🚨 FINAL WEEK OF QUARTER</p>
          <p className="text-xs text-gray-300 mt-1">This is it. Make every hour count.</p>
        </div>
      )}
    </GlassCard>
  );
}
