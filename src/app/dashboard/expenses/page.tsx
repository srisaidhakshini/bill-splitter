'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  'Food & Drinks',
  'Travel',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Other',
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Food & Drinks': { bg: '#dcfce7', text: '#166534' },
  'Travel': { bg: '#dce1ff', text: '#264191' },
  'Utilities': { bg: '#e0f2fe', text: '#0369a1' },
  'Entertainment': { bg: '#fef9c3', text: '#854d0e' },
  'Shopping': { bg: '#fce7f3', text: '#9d174d' },
  'Health': { bg: '#c9e6ff', text: '#004c6e' },
  'Other': { bg: '#e5eeff', text: '#1d3989' },
};

const categoryIcons: Record<string, string> = {
  'Food & Drinks': 'local_dining',
  'Travel': 'directions_car',
  'Utilities': 'bolt',
  'Entertainment': 'movie',
  'Shopping': 'shopping_cart',
  'Health': 'medical_services',
  'Other': 'category',
};

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [formError, setFormError] = useState('');
  const [userId, setUserId] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Drinks');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadExpenses = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (!error) setExpenses(data || []);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      loadExpenses(user.id).finally(() => setLoading(false));
    });
  }, [router, loadExpenses]);

  // Computed stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const spentThisMonth = expenses.filter(e => new Date(e.created_at) >= monthStart).reduce((s, e) => s + Number(e.amount), 0);
  const avgPerTransaction = expenses.length > 0 ? totalSpent / expenses.length : 0;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) { setFormError('Please enter a description.'); return; }
    if (!amount) { setFormError('Please enter an amount.'); return; }
    if (isNaN(Number(amount))) { setFormError('Amount must be a number.'); return; }
    if (Number(amount) <= 0) { setFormError('Amount must be greater than zero.'); return; }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('personal_expenses').insert({
      user_id: userId,
      title: title.trim(),
      amount: Number(amount),
      category,
    });

    if (error) {
      setFormError('We could not save your expense. Please try again.');
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food & Drinks');
      await loadExpenses(userId);
      showToast('Expense added successfully.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    const supabase = createClient();
    const { error } = await supabase.from('personal_expenses').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      showToast('Could not delete expense. Please try again.', 'error');
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast('Expense deleted.');
    }
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-[#0058be] animate-pulse">receipt_long</span>
          <p className="text-[#424754] font-medium">Loading your expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16 md:pt-6 min-h-screen animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm toast-enter ${toast.type === 'success' ? 'bg-[#0058be]' : 'bg-[#ba1a1a]'}`}>
          <span className="material-symbols-outlined text-lg">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h2 className="font-bold text-[#0b1c30]" style={{ fontSize: '28px' }}>My Expenses</h2>
        <p className="text-[#424754] mt-1 text-sm">Track your personal spending</p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Spent (All Time)', value: `₹${totalSpent.toFixed(2)}`, icon: 'account_balance_wallet', color: '#0058be', bg: '#d8e2ff' },
          { label: 'Spent This Month', value: `₹${spentThisMonth.toFixed(2)}`, icon: 'calendar_month', color: '#00628d', bg: '#c9e6ff' },
          { label: 'Total Transactions', value: expenses.length.toString(), icon: 'receipt_long', color: '#4059aa', bg: '#dce1ff' },
          { label: 'Avg Per Transaction', value: `₹${avgPerTransaction.toFixed(2)}`, icon: 'analytics', color: '#0058be', bg: '#e5eeff' },
        ].map(card => (
          <div key={card.label} className="stat-card flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#424754]">{card.label}</p>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <span className="material-symbols-outlined text-lg" style={{ color: card.color }}>{card.icon}</span>
              </div>
            </div>
            <p className="font-bold text-[#0b1c30]" style={{ fontSize: '24px' }}>{card.value}</p>
          </div>
        ))}
      </section>

      {/* Add Expense Form */}
      <section className="ocean-card rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#d8e2ff] rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[#0058be] text-xl">add_card</span>
          </div>
          <h3 className="font-semibold text-[#0058be]" style={{ fontSize: '20px' }}>Add New Expense</h3>
        </div>

        <form onSubmit={handleAddExpense} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">Description</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Coffee at airport"
                className="form-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727785] font-semibold">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="form-input pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-input"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3 mb-4">
              <span className="material-symbols-outlined text-[#ba1a1a] text-lg">error</span>
              <p className="text-[#93000a] text-sm">{formError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#0058be] text-white rounded-xl font-semibold text-sm hover:bg-[#0058be]/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>Adding...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">add</span>Add Expense</>
            )}
          </button>
        </form>
      </section>

      {/* Expenses List */}
      <section>
        <h3 className="font-semibold text-[#0b1c30] text-lg mb-4">Your Expenses</h3>

        {expenses.length === 0 ? (
          <div className="ocean-card rounded-2xl p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-[#c2c6d6] block mb-3">receipt_long</span>
            <p className="text-[#424754] font-medium">No expenses yet. Add your first one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(expense => {
              const col = categoryColors[expense.category] || { bg: '#e5eeff', text: '#1d3989' };
              return (
                <div key={expense.id} className="ocean-card rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: col.bg }}>
                      <span className="material-symbols-outlined text-xl" style={{ color: col.text }}>
                        {categoryIcons[expense.category] || 'category'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#0b1c30] truncate">{expense.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: col.bg, color: col.text }}>
                          {expense.category}
                        </span>
                        <span className="text-xs text-[#727785]">
                          {new Date(expense.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-bold text-[#0b1c30] text-lg">₹{Number(expense.amount).toFixed(2)}</p>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleteId === expense.id}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors disabled:opacity-50"
                      title="Delete expense"
                    >
                      {deleteId === expense.id ? (
                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-lg">delete</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
