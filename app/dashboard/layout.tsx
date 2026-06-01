'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  Home,
  BookOpen,
  Calendar,
  FileText,
  LineChart,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Workspace', href: '/dashboard', icon: Home },
  { name: 'Learning Board', href: '/dashboard/board', icon: BookOpen },
  { name: 'Reflection Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Intelligence Review', href: '/dashboard/analytics', icon: LineChart },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b10] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border border-cyan-200/20 border-t-cyan-200"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b10]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 border-r border-white/10 bg-[#090f16]/95 backdrop-blur-xl transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Close button */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-200/25 bg-cyan-200/[0.08]">
                <span className="text-sm font-bold text-cyan-100">BF</span>
              </div>
              <span className="text-lg font-semibold text-white">BeyondFleet</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Back to Home */}
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-3 text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Intelligence
            </p>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'border border-cyan-200/25 bg-cyan-200/[0.08] text-white'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? 'text-cyan-200' : ''}`}
                  />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="border-t border-white/10 p-3">
            <Link
              href="/briefs"
              className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Daily Briefs</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b10]/88 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-semibold text-white">Workspace</span>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
