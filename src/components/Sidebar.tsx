'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '/dashboard/expenses', label: 'Expenses', icon: 'receipt_long' },
  { href: '/dashboard/groups', label: 'Groups', icon: 'group' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 pb-8 pt-2">
        <h1 className="font-bold text-[#adc6ff]" style={{ fontSize: '24px', lineHeight: '32px' }}>Oceanic Split</h1>
        <p className="text-[10px] text-[#d3e4fe] opacity-70 mt-1 uppercase tracking-widest">Student Finance</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive(item.href)
                ? 'bg-[#2170e4] text-white shadow-md'
                : 'text-[#d3e4fe] hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={`material-symbols-outlined text-xl transition-transform ${isActive(item.href) ? '' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="text-sm font-semibold">{item.label}</span>
            {isActive(item.href) && (
              <span className="ml-auto material-symbols-outlined text-sm opacity-70">chevron_right</span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="mt-auto px-4 pb-4 border-t border-white/10 pt-4">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-[#2170e4] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(user.full_name || 'U')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[#f8f9ff] text-sm font-semibold truncate">{user.full_name}</p>
              <p className="text-[10px] text-[#d3e4fe] opacity-60 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#d3e4fe] hover:text-white hover:bg-white/10 transition-colors text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="fixed top-4 left-4 z-[60] md:hidden w-10 h-10 bg-[#213145] text-white rounded-xl flex items-center justify-center shadow-lg"
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-xl">{mobileOpen ? 'close' : 'menu'}</span>
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-[260px] bg-[#213145] z-[56] shadow-2xl transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pt-16">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[260px] bg-[#213145] flex-col py-6 z-50 shadow-sm">
        <SidebarContent />
      </aside>
    </>
  );
}
