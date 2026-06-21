'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';

interface Stats {
  totalSpent: number;
  spentThisMonth: number;
  totalGroups: number;
  groupsCreated: number;
}

interface RecentExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
}

const categoryIcons: Record<string, string> = {
  'Food & Drinks': 'local_dining',
  'Travel': 'directions_car',
  'Utilities': 'bolt',
  'Entertainment': 'movie',
  'Shopping': 'shopping_cart',
  'Health': 'medical_services',
  'Other': 'category',
};

const categoryColors: Record<string, string> = {
  'Food & Drinks': '#c9e6ff',
  'Travel': '#dce1ff',
  'Utilities': '#dce9ff',
  'Entertainment': '#ffdad6',
  'Shopping': '#dce1ff',
  'Health': '#c9e6ff',
  'Other': '#e5eeff',
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<Stats>({ totalSpent: 0, spentThisMonth: 0, totalGroups: 0, groupsCreated: 0 });
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Friend');

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Personal expenses stats
      const [allExpenses, monthExpenses, recentData] = await Promise.all([
        supabase.from('personal_expenses').select('amount').eq('user_id', user.id),
        supabase.from('personal_expenses').select('amount').eq('user_id', user.id).gte('created_at', monthStart),
        supabase.from('personal_expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      const totalSpent = (allExpenses.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
      const spentThisMonth = (monthExpenses.data || []).reduce((sum, e) => sum + Number(e.amount), 0);

      // Groups stats - try to load, handle RLS recursion gracefully
      let totalGroups = 0;
      let groupsCreated = 0;
      try {
        const [createdGroups, memberGroups] = await Promise.all([
          supabase.from('groups').select('id').eq('created_by', user.id),
          supabase.from('group_members').select('group_id').eq('user_id', user.id),
        ]);
        groupsCreated = createdGroups.data?.length || 0;
        totalGroups = memberGroups.data?.length || 0;
      } catch {
        // RLS policy may still have issues - continue gracefully
      }

      setStats({ totalSpent, spentThisMonth, totalGroups, groupsCreated });
      setRecentExpenses(recentData.data || []);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-[#0058be] animate-pulse">payments</span>
          <p className="text-[#424754] font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16 md:pt-6 min-h-screen animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <h2 className="font-bold text-[#0b1c30]" style={{ fontSize: '28px', lineHeight: '36px' }}>
          Welcome back, <span className="text-[#0058be]">{userName}</span>! 👋
        </h2>
        <p className="text-[#424754] mt-1">Here&apos;s your financial overview at a glance.</p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div className="stat-card flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#424754]">Total Spent</p>
            <div className="w-10 h-10 rounded-xl bg-[#d8e2ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0058be] text-lg">account_balance_wallet</span>
            </div>
          </div>
          <p className="font-bold text-[#0b1c30]" style={{ fontSize: '28px' }}>{formatCurrency(stats.totalSpent)}</p>
          <p className="text-xs text-[#424754]">All time personal expenses</p>
        </div>

        <div className="stat-card flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#424754]">This Month</p>
            <div className="w-10 h-10 rounded-xl bg-[#c9e6ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00628d] text-lg">calendar_month</span>
            </div>
          </div>
          <p className="font-bold text-[#00628d]" style={{ fontSize: '28px' }}>{formatCurrency(stats.spentThisMonth)}</p>
          <p className="text-xs text-[#424754]">Current month spending</p>
        </div>

        <div className="stat-card flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#424754]">My Groups</p>
            <div className="w-10 h-10 rounded-xl bg-[#dce1ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#4059aa] text-lg">group</span>
            </div>
          </div>
          <p className="font-bold text-[#4059aa]" style={{ fontSize: '28px' }}>{stats.totalGroups}</p>
          <p className="text-xs text-[#424754]">Groups you belong to</p>
        </div>

        <div className="stat-card flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#424754]">Created Groups</p>
            <div className="w-10 h-10 rounded-xl bg-[#dce9ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0058be] text-lg">add_circle</span>
            </div>
          </div>
          <p className="font-bold text-[#0058be]" style={{ fontSize: '28px' }}>{stats.groupsCreated}</p>
          <p className="text-xs text-[#424754]">Groups you created</p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h3 className="font-semibold text-[#0b1c30] text-lg mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/expenses"
            className="flex items-center gap-2 px-5 py-3 bg-[#0058be] text-white rounded-xl font-semibold text-sm hover:bg-[#0058be]/90 active:scale-[0.98] transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add an Expense
          </Link>
          <Link
            href="/dashboard/groups"
            className="flex items-center gap-2 px-5 py-3 bg-white border border-[#c2c6d6] text-[#0058be] rounded-xl font-semibold text-sm hover:bg-[#eff4ff] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-lg">group_add</span>
            Create a Group
          </Link>
        </div>
      </section>

      {/* Recent Expenses */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-[#0b1c30] text-lg">Recent Personal Expenses</h3>
          <Link href="/dashboard/expenses" className="text-[#0058be] text-sm font-semibold hover:underline flex items-center gap-1">
            View All
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="ocean-card rounded-2xl p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-[#c2c6d6] block mb-3">receipt_long</span>
            <p className="text-[#424754] font-medium">No expenses yet.</p>
            <p className="text-[#727785] text-sm mt-1">Add your first expense to get started!</p>
            <Link href="/dashboard/expenses" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#0058be] text-white rounded-xl text-sm font-semibold hover:bg-[#0058be]/90 transition-colors">
              <span className="material-symbols-outlined text-lg">add</span>
              Add Expense
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map(expense => (
              <div key={expense.id} className="ocean-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: categoryColors[expense.category] || '#e5eeff' }}>
                    <span className="material-symbols-outlined text-[#0058be] text-xl">
                      {categoryIcons[expense.category] || 'category'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0b1c30]">{expense.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#4059aa]">{expense.category}</span>
                      <span className="text-xs text-[#727785]">{new Date(expense.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <p className="font-bold text-[#0b1c30] text-lg">{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
