'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Leads', href: '/leads', icon: '👥' },
  { name: 'Deals', href: '/deals', icon: '💼' },
  { name: 'Products', href: '/products', icon: '📦' },
  { name: 'Reports', href: '/reports', icon: '📈', disabled: true },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();

  const user = session?.user;
  const userName = user?.name || 'User';
  const userRole = (user as any)?.role?.replace('_', ' ') || 'User';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] border-r border-white/10 bg-[#1a1f2e]/95 backdrop-blur-md transition-all duration-300 lg:bg-[#1a1f2e]/60 lg:backdrop-blur-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Logo on mobile */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
          <span className="text-lg font-semibold text-white">The Algorithm's Forge</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex items-center justify-between border-b border-white/10 px-3 py-3">
          {!isCollapsed && (
            <span className="text-sm font-semibold text-white truncate">The Algorithm's Forge</span>
          )}
          {isCollapsed && (
            <span className="text-sm font-bold text-cyan-400 mx-auto">TAF</span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  } else {
                    onClose?.();
                  }
                }}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  item.disabled
                    ? 'cursor-not-allowed text-white/30'
                    : isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
                {!isCollapsed && item.disabled && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-white/30">Soon</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10">
          {/* Powered by */}
          {!isCollapsed && (
            <div className="px-4 py-2 border-b border-white/5">
              <p className="text-[10px] text-white/30 text-center">Powered by The Algorithm</p>
            </div>
          )}

          {/* User section */}
          <div className="p-3">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30 flex-shrink-0">
                <span className="text-sm font-medium text-cyan-400">
                  {userName.charAt(0)}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-cyan-400/70">{userRole}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
