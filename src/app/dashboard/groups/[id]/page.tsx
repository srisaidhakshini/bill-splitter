'use client';
import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase';

interface Member {
  user_id: string;
  name: string;
  email: string;
}

interface GroupExpense {
  id: string;
  title: string;
  amount: number;
  created_by: string;
  created_at: string;
  expense_date: string;
  payer_name?: string;
}

interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface Balance {
  user_id: string;
  name: string;
  paid: number;
  share: number;
  balance: number;
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Add member form
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  // Add expense form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [addingExpense, setAddingExpense] = useState(false);
  const [expError, setExpError] = useState('');

  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const computeBalances = useCallback((memberList: Member[], expenseList: GroupExpense[]): Balance[] => {
    const total = expenseList.reduce((s, e) => s + Number(e.amount), 0);
    const share = memberList.length > 0 ? total / memberList.length : 0;

    return memberList.map(m => {
      const paid = expenseList.filter(e => e.created_by === m.user_id).reduce((s, e) => s + Number(e.amount), 0);
      return { user_id: m.user_id, name: m.name, paid, share, balance: paid - share };
    });
  }, []);

  const loadGroupData = useCallback(async (uid: string) => {
    const supabase = createClient();

    const [groupRes, membersRes, expensesRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('group_members').select('user_id').eq('group_id', groupId),
      supabase.from('group_expenses').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
    ]);

    if (groupRes.error || !groupRes.data) { router.push('/dashboard/groups'); return; }
    setGroup(groupRes.data);

    // Load profile info for all members
    const memberIds = (membersRes.data || []).map(m => m.user_id);
    const profilesRes = await supabase.from('profiles').select('id, full_name').in('id', memberIds);
    const profileMap: Record<string, string> = {};
    (profilesRes.data || []).forEach(p => { profileMap[p.id] = p.full_name || p.id; });

    // Also get emails from auth users via profiles.email if available
    const memberList: Member[] = memberIds.map(mid => ({
      user_id: mid,
      name: profileMap[mid] || 'Unknown User',
      email: '',
    }));

    setMembers(memberList);

    // Enrich expenses with payer name
    const enrichedExpenses = (expensesRes.data || []).map((e: GroupExpense) => ({
      ...e,
      payer_name: profileMap[e.created_by] || 'Unknown',
    }));

    setExpenses(enrichedExpenses);
    setBalances(computeBalances(memberList, enrichedExpenses));

    // Set default payer
    if (expPaidBy === '' && memberList.length > 0) {
      setExpPaidBy(uid);
    }
  }, [groupId, router, computeBalances, expPaidBy]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      setExpPaidBy(user.id);
      loadGroupData(user.id).finally(() => setLoading(false));
    });
  }, [router, loadGroupData]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    if (!memberEmail.trim()) { setMemberError('Please enter an email address.'); return; }

    setAddingMember(true);
    const supabase = createClient();

    // Find profile by email (requires email column on profiles)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', memberEmail.trim().toLowerCase())
      .single();

    if (profileError || !profileData) {
      setMemberError('No user found with that email. Ask them to sign up first.');
      setAddingMember(false);
      return;
    }

    // Check if already member
    const existing = members.find(m => m.user_id === profileData.id);
    if (existing) {
      setMemberError('This person is already in the group.');
      setAddingMember(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: profileData.id });

    if (insertError) {
      setMemberError('Could not add this member. Please try again.');
    } else {
      setMemberEmail('');
      const name = profileData.full_name || memberEmail.trim();
      const newMember: Member = { user_id: profileData.id, name, email: memberEmail.trim() };
      const updatedMembers = [...members, newMember];
      setMembers(updatedMembers);
      setBalances(computeBalances(updatedMembers, expenses));
      showToast(`${name} has been added to the group.`);
    }
    setAddingMember(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError('');
    if (!expTitle.trim()) { setExpError('Please enter a description.'); return; }
    if (!expAmount) { setExpError('Please enter an amount.'); return; }
    if (isNaN(Number(expAmount))) { setExpError('Amount must be a number.'); return; }
    if (Number(expAmount) <= 0) { setExpError('Amount must be greater than zero.'); return; }

    setAddingExpense(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('group_expenses')
      .insert({
        group_id: groupId,
        created_by: expPaidBy,
        title: expTitle.trim(),
        amount: Number(expAmount),
        expense_date: expDate,
      })
      .select()
      .single();

    if (error || !data) {
      setExpError('Could not add expense. Please try again.');
    } else {
      const payer = members.find(m => m.user_id === expPaidBy);
      const newExp: GroupExpense = { ...data, payer_name: payer?.name || 'Unknown' };
      const updatedExpenses = [newExp, ...expenses];
      setExpenses(updatedExpenses);
      setBalances(computeBalances(members, updatedExpenses));
      setExpTitle('');
      setExpAmount('');
      setExpDate(new Date().toISOString().split('T')[0]);
      showToast('Expense added to the group.');
    }
    setAddingExpense(false);
  };

  const handleDeleteExpense = async (id: string) => {
    setDeleteExpId(id);
    const supabase = createClient();
    const { error } = await supabase.from('group_expenses').delete().eq('id', id);
    if (error) {
      showToast('Could not delete expense. Please try again.', 'error');
    } else {
      const updatedExpenses = expenses.filter(e => e.id !== id);
      setExpenses(updatedExpenses);
      setBalances(computeBalances(members, updatedExpenses));
      showToast('Expense deleted.');
    }
    setDeleteExpId(null);
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-[#0058be] animate-pulse">group</span>
          <p className="text-[#424754] font-medium">Loading group...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16 md:pt-6 min-h-screen animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm toast-enter ${toast.type === 'success' ? 'bg-[#0058be]' : 'bg-[#ba1a1a]'}`}>
          <span className="material-symbols-outlined text-lg">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/dashboard/groups" className="text-[#0058be] hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          My Groups
        </Link>
        <span className="text-[#c2c6d6]">/</span>
        <span className="text-[#424754] font-medium">{group?.name}</span>
      </div>

      {/* Group Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h2 className="font-bold text-[#0b1c30]" style={{ fontSize: '28px' }}>{group?.name}</h2>
          <p className="text-[#424754] mt-1 text-sm">{members.length} member{members.length !== 1 ? 's' : ''} · Created {group ? new Date(group.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
        </div>
        <div className="px-4 py-2 bg-[#e5eeff] rounded-full text-[#0058be] font-semibold text-sm">
          Total: ₹{totalExpenses.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Members & Balance */}
        <div className="xl:col-span-1 space-y-6">
          {/* Members */}
          <div className="ocean-card rounded-2xl p-5">
            <h3 className="font-semibold text-[#0b1c30] text-base mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0058be]">group</span>
              Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f8f9ff] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-[#2170e4] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {m.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#0b1c30] text-sm truncate">{m.name}</p>
                    {m.user_id === group?.created_by && <span className="text-xs text-[#0058be] font-semibold">Creator</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Member (creator only) */}
            {group?.created_by === userId && (
              <form onSubmit={handleAddMember} className="mt-4 pt-4 border-t border-[#e5eeff]" noValidate>
                <p className="text-xs font-semibold text-[#424754] uppercase tracking-wider mb-2">Add Member by Email</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={e => setMemberEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="form-input text-sm flex-1"
                  />
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="px-3 py-2 bg-[#0058be] text-white rounded-xl text-sm font-semibold hover:bg-[#0058be]/90 transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    {addingMember ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">person_add</span>}
                  </button>
                </div>
                {memberError && <p className="text-[#ba1a1a] text-xs mt-1">{memberError}</p>}
              </form>
            )}
          </div>

          {/* Balance Summary */}
          <div className="ocean-card rounded-2xl p-5">
            <h3 className="font-semibold text-[#0b1c30] text-base mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0058be]">balance</span>
              Balance Summary
            </h3>
            <div className="space-y-3">
              {balances.map(b => (
                <div key={b.user_id} className="p-3 rounded-xl bg-[#f8f9ff]">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-[#0b1c30] text-sm">{b.name}</p>
                    <span className={`text-sm font-bold ${b.balance >= 0 ? 'text-[#0058be]' : 'text-[#ba1a1a]'}`}>
                      {b.balance >= 0 ? '+' : ''}₹{Math.abs(b.balance).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#727785] mt-1">
                    <span>Paid: ₹{b.paid.toFixed(2)}</span>
                    <span>Share: ₹{b.share.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${totalExpenses > 0 ? Math.min((b.paid / totalExpenses) * 100, 100) : 0}%`,
                        backgroundColor: b.balance >= 0 ? '#0058be' : '#ba1a1a',
                      }}
                    />
                  </div>
                  <p className={`text-xs font-semibold mt-1 ${b.balance >= 0 ? 'text-[#0058be]' : 'text-[#ba1a1a]'}`}>
                    {b.balance === 0 ? '✓ Settled' : b.balance > 0 ? `Is owed ₹${b.balance.toFixed(2)}` : `Owes ₹${Math.abs(b.balance).toFixed(2)}`}
                  </p>
                </div>
              ))}
              {balances.length === 0 && (
                <p className="text-sm text-[#727785] text-center py-4">Add members and expenses to see balances.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Add Expense & Expense List */}
        <div className="xl:col-span-2 space-y-6">
          {/* Add Group Expense Form */}
          <div className="ocean-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#d8e2ff] rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[#0058be] text-xl">add_card</span>
              </div>
              <h3 className="font-semibold text-[#0058be]" style={{ fontSize: '18px' }}>Add Group Expense</h3>
            </div>
            <form onSubmit={handleAddExpense} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">Description</label>
                  <input type="text" value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder="e.g., Dinner at beach shack" className="form-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727785] font-semibold">₹</span>
                    <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" className="form-input pl-7" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">Who Paid?</label>
                  <select value={expPaidBy} onChange={e => setExpPaidBy(e.target.value)} className="form-input">
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.name}{m.user_id === userId ? ' (You)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">Date</label>
                  <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="form-input" />
                </div>
              </div>

              {expError && (
                <div className="flex items-center gap-2 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3 mb-4">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-lg">error</span>
                  <p className="text-[#93000a] text-sm">{expError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={addingExpense || members.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-[#0058be] text-white rounded-xl font-semibold text-sm hover:bg-[#0058be]/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {addingExpense ? <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>Adding...</> : <><span className="material-symbols-outlined text-lg">add</span>Add Expense</>}
              </button>
              {members.length === 0 && <p className="text-xs text-[#727785] mt-2">Add at least one member before logging expenses.</p>}
            </form>
          </div>

          {/* Group Expenses List */}
          <div>
            <h3 className="font-semibold text-[#0b1c30] text-lg mb-4">Group Expenses</h3>
            {expenses.length === 0 ? (
              <div className="ocean-card rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-5xl text-[#c2c6d6] block mb-3">receipt_long</span>
                <p className="text-[#424754] font-medium">No group expenses yet.</p>
                <p className="text-[#727785] text-sm mt-1">Add the first shared expense above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map(expense => (
                  <div key={expense.id} className="ocean-card rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#d8e2ff] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[#0058be] text-lg">receipt</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#0b1c30] truncate">{expense.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-[#424754]">
                            Paid by <span className="font-semibold text-[#0058be]">{expense.payer_name}</span>
                          </span>
                          <span className="text-xs text-[#727785]">
                            {expense.expense_date ? new Date(expense.expense_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(expense.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-bold text-[#0b1c30] text-lg">₹{Number(expense.amount).toFixed(2)}</p>
                      {(expense.created_by === userId || group?.created_by === userId) && (
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={deleteExpId === expense.id}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors disabled:opacity-50"
                        >
                          {deleteExpId === expense.id ? (
                            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-lg">delete</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
