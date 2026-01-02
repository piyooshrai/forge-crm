'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Leads', href: '/leads', icon: '👥' },
  { name: 'Deals', href: '/deals', icon: '💼' },
  { name: 'Products', href: '/products', icon: '📦' },
  { name: 'Reports', href: '/reports', icon: '📈' },
  { name: 'Settings', href: '/settings', icon: '⚙️', adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Default to SUPER_ADMIN for demo if session not loaded
  const userRole = session?.user?.role || UserRole.SUPER_ADMIN;

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || userRole === UserRole.SUPER_ADMIN
  );

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-white/10 bg-[#1a1f2e]/60 backdrop-blur-sm">
      <nav className="flex flex-col gap-1 p-4">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

