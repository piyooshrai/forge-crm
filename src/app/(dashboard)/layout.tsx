import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Skip auth check for demo - just show the UI
  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white/90">
      <Header />
      <Sidebar />
      <main className="ml-64 pt-16">{children}</main>
    </div>
  );
}

