'use client';
import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Member {
  id: string;       // auth user_id OR guest_members.id
  name: string;
  isGuest: boolean;
}

interface GroupExpense {
  id: string;
  title: string;
  amount: number;
  created_by: string;
  paid_by_user: string | null;
  paid_by_guest: string | null;
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
  id: string;
  name: string;
  paid: number;
  share: number;
  balance: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the effective payer id for an expense (paid_by_user or paid_by_guest, fallback created_by). */
function effectivePayer(e: GroupExpense): string {
  return e.paid_by_guest ?? e.paid_by_user ?? e.created_by;
}

function computeBalances(memberList: Member[], expenseList: GroupExpense[]): Balance[] {
  const total = expenseList.reduce((s, e) => s + Number(e.amount), 0);
  const share = memberList.length > 0 ? total / memberList.length : 0;
  return memberList.map(m => {
    const paid = expenseList
      .filter(e => effectivePayer(e) === m.id)
      .reduce((s, e) => s + Number(e.amount), 0);
    return { id: m.id, name: m.name, paid, share, balance: paid - share };
  });
}

function computeSettlements(balances: Balance[]): Settlement[] {
  const creditors = balances.filter(b => b.balance > 0.005).map(b => ({ ...b }));
  const debtors   = balances.filter(b => b.balance < -0.005).map(b => ({ ...b }));
  const settlements: Settlement[] = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt   = debtors[di];
    const amount = Math.min(credit.balance, -debt.balance);
    settlements.push({ from: debt.name, to: credit.name, amount });
    credit.balance -= amount;
    debt.balance   += amount;
    if (Math.abs(credit.balance) < 0.005) ci++;
    if (Math.abs(debt.balance)   < 0.005) di++;
  }
  return settlements;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const [userId, setUserId]   = useState('');
  const [group,  setGroup]    = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses]     = useState<GroupExpense[]>([]);
  const [balances, setBalances]     = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Add-member state
  const [addMemberTab, setAddMemberTab] = useState<'email' | 'name'>('email');
  const [memberEmail, setMemberEmail]   = useState('');
  const [guestName,   setGuestName]     = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError,  setMemberError]  = useState('');

  // Add-expense state
  const [expTitle,    setExpTitle]    = useState('');
  const [expAmount,   setExpAmount]   = useState('');
  const [expPaidBy,   setExpPaidBy]   = useState('');   // member id (auth or guest)
  const [expDate,     setExpDate]     = useState(new Date().toISOString().split('T')[0]);
  const [addingExpense, setAddingExpense] = useState(false);
  const [expError,    setExpError]    = useState('');

  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);
  const [removingGuestId, setRemovingGuestId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshBalances = useCallback((ml: Member[], el: GroupExpense[]) => {
    const b = computeBalances(ml, el);
    setBalances(b);
    setSettlements(computeSettlements(b));
  }, []);

  const loadGroupData = useCallback(async (uid: string) => {
    const supabase = createClient();

    const [groupRes, authMembersRes, guestMembersRes, expensesRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('group_members').select('user_id').eq('group_id', groupId),
      supabase.from('guest_members').select('id, name').eq('group_id', groupId).order('created_at', { ascending: true }),
      supabase.from('group_expenses').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
    ]);

    if (groupRes.error || !groupRes.data) { router.push('/dashboard/groups'); return; }
    setGroup(groupRes.data);

    // Load profile names for auth members
    const authIds = (authMembersRes.data || []).map(m => m.user_id);
    let profileMap: Record<string, string> = {};
    if (authIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', authIds);
      (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || 'Unknown'; });
    }

    // Build unified member list: auth first, then guests
    const authMembers: Member[] = authIds.map(id => ({
      id,
      name: profileMap[id] || 'Unknown User',
      isGuest: false,
    }));
    const guestMembers: Member[] = (guestMembersRes.data || []).map(g => ({
      id: g.id,
      name: g.name,
      isGuest: true,
    }));
    const memberList = [...authMembers, ...guestMembers];
    setMembers(memberList);

    // Build name map for expense display (covers both auth and guests)
    const nameMap: Record<string, string> = {};
    memberList.forEach(m => { nameMap[m.id] = m.name; });

    // Enrich expenses with payer name
    const enrichedExpenses: GroupExpense[] = (expensesRes.data || []).map(e => ({
      ...e,
      payer_name: nameMap[e.paid_by_guest ?? e.paid_by_user ?? e.created_by] || 'Unknown',
    }));

    setExpenses(enrichedExpenses);
    refreshBalances(memberList, enrichedExpenses);

    // Default payer = current user
    setExpPaidBy(uid);
  }, [groupId, router, refreshBalances]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      loadGroupData(user.id).finally(() => setLoading(false));
    });
  }, [router, loadGroupData]);

  // ── Add member by email ──────────────────────────────────────────────────

  const handleAddByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    if (!memberEmail.trim()) { setMemberError('Please enter an email address.'); return; }

    setAddingMember(true);
    const supabase = createClient();

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
    if (members.find(m => m.id === profileData.id)) {
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
      const newMember: Member = { id: profileData.id, name, isGuest: false };
      const updated = [...members, newMember];
      setMembers(updated);
      refreshBalances(updated, expenses);
      showToast(`${name} has been added to the group.`);
    }
    setAddingMember(false);
  };

  // ── Add guest by name ────────────────────────────────────────────────────

  const handleAddByName = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    const trimmed = guestName.trim();
    if (!trimmed) { setMemberError('Please enter a name.'); return; }
    if (members.find(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setMemberError('A member with this name already exists.');
      return;
    }

    setAddingMember(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('guest_members')
      .insert({ group_id: groupId, name: trimmed, created_by: userId })
      .select('id, name')
      .single();

    if (error || !data) {
      setMemberError('Could not add guest. Please try again.');
    } else {
      setGuestName('');
      const newMember: Member = { id: data.id, name: data.name, isGuest: true };
      const updated = [...members, newMember];
      setMembers(updated);
      refreshBalances(updated, expenses);
      showToast(`${data.name} added as a guest member.`);
    }
    setAddingMember(false);
  };

  // ── Remove guest member ──────────────────────────────────────────────────

  const handleRemoveGuest = async (guestId: string) => {
    setRemovingGuestId(guestId);
    const supabase = createClient();
    const { error } = await supabase.from('guest_members').delete().eq('id', guestId);
    if (error) {
      showToast('Could not remove guest. Please try again.', 'error');
    } else {
      const updated = members.filter(m => m.id !== guestId);
      setMembers(updated);
      refreshBalances(updated, expenses);
      showToast('Guest removed from group.');
    }
    setRemovingGuestId(null);
  };

  // ── Add expense ──────────────────────────────────────────────────────────

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError('');
    if (!expTitle.trim())        { setExpError('Please enter a description.'); return; }
    if (!expAmount)              { setExpError('Please enter an amount.'); return; }
    if (isNaN(Number(expAmount))) { setExpError('Amount must be a number.'); return; }
    if (Number(expAmount) <= 0)  { setExpError('Amount must be greater than zero.'); return; }

    const payer = members.find(m => m.id === expPaidBy);
    if (!payer) { setExpError('Please select who paid.'); return; }

    setAddingExpense(true);
    const supabase = createClient();

    const insertPayload = {
      group_id:      groupId,
      created_by:    userId,               // always the session user for RLS
      paid_by_user:  payer.isGuest ? null  : payer.id,
      paid_by_guest: payer.isGuest ? payer.id : null,
      title:         expTitle.trim(),
      amount:        Number(expAmount),
      expense_date:  expDate,
    };

    const { data, error } = await supabase
      .from('group_expenses')
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      setExpError('Could not add expense. Please try again.');
    } else {
      const newExp: GroupExpense = { ...data, payer_name: payer.name };
      const updated = [newExp, ...expenses];
      setExpenses(updated);
      refreshBalances(members, updated);
      setExpTitle('');
      setExpAmount('');
      setExpDate(new Date().toISOString().split('T')[0]);
      showToast('Expense added to the group.');
    }
    setAddingExpense(false);
  };

  // ── Delete expense ───────────────────────────────────────────────────────

  const handleDeleteExpense = async (id: string) => {
    setDeleteExpId(id);
    const supabase = createClient();
    const { error } = await supabase.from('group_expenses').delete().eq('id', id);
    if (error) {
      showToast('Could not delete expense.', 'error');
    } else {
      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      refreshBalances(members, updated);
      showToast('Expense deleted.');
    }
    setDeleteExpId(null);
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const isCreator = group?.created_by === userId;

  // ── Loading ──────────────────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────

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
          <p className="text-[#424754] mt-1 text-sm">
            {members.length} member{members.length !== 1 ? 's' : ''} · Created {group ? new Date(group.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </p>
        </div>
        <div className="px-4 py-2 bg-[#e5eeff] rounded-full text-[#0058be] font-semibold text-sm">
          Total: ₹{totalExpenses.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left Column ─────────────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-6">

          {/* Members Card */}
          <div className="ocean-card rounded-2xl p-5">
            <h3 className="font-semibold text-[#0b1c30] text-base mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0058be]">group</span>
              Members ({members.length})
            </h3>

            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f8f9ff] transition-colors group">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${m.isGuest ? 'bg-[#6b7280]' : 'bg-[#2170e4]'}`}>
                    {m.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#0b1c30] text-sm truncate">{m.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {m.id === group?.created_by && <span className="text-xs text-[#0058be] font-semibold">Creator</span>}
                      {m.isGuest && (
                        <span className="text-xs bg-[#f3f4f6] text-[#6b7280] px-1.5 py-0.5 rounded-md font-medium">Guest</span>
                      )}
                    </div>
                  </div>
                  {/* Remove guest button (creator only) */}
                  {isCreator && m.isGuest && (
                    <button
                      onClick={() => handleRemoveGuest(m.id)}
                      disabled={removingGuestId === m.id}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
                      title="Remove guest"
                    >
                      {removingGuestId === m.id
                        ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        : <span className="material-symbols-outlined text-base">person_remove</span>
                      }
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Member Panel — creator only */}
            {isCreator && (
              <div className="mt-4 pt-4 border-t border-[#e5eeff]">
                {/* Tabs */}
                <div className="flex rounded-xl overflow-hidden border border-[#e5eeff] mb-3">
                  <button
                    onClick={() => { setAddMemberTab('email'); setMemberError(''); }}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${addMemberTab === 'email' ? 'bg-[#0058be] text-white' : 'text-[#424754] hover:bg-[#f8f9ff]'}`}
                  >
                    <span className="material-symbols-outlined text-sm">alternate_email</span>
                    By Email
                  </button>
                  <button
                    onClick={() => { setAddMemberTab('name'); setMemberError(''); }}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${addMemberTab === 'name' ? 'bg-[#0058be] text-white' : 'text-[#424754] hover:bg-[#f8f9ff]'}`}
                  >
                    <span className="material-symbols-outlined text-sm">badge</span>
                    By Name
                  </button>
                </div>

                {/* Email tab */}
                {addMemberTab === 'email' && (
                  <form onSubmit={handleAddByEmail} noValidate>
                    <p className="text-xs text-[#727785] mb-2">Add a registered user by their email address.</p>
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
                        {addingMember
                          ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                          : <span className="material-symbols-outlined text-lg">person_add</span>
                        }
                      </button>
                    </div>
                  </form>
                )}

                {/* Name tab */}
                {addMemberTab === 'name' && (
                  <form onSubmit={handleAddByName} noValidate>
                    <p className="text-xs text-[#727785] mb-2">Add someone by name — no account needed. You&apos;ll log expenses on their behalf.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        placeholder='e.g., "Priya" or "Rahul"'
                        className="form-input text-sm flex-1"
                      />
                      <button
                        type="submit"
                        disabled={addingMember}
                        className="px-3 py-2 bg-[#4059aa] text-white rounded-xl text-sm font-semibold hover:bg-[#4059aa]/90 transition-colors disabled:opacity-60 flex items-center gap-1"
                      >
                        {addingMember
                          ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                          : <span className="material-symbols-outlined text-lg">person_add</span>
                        }
                      </button>
                    </div>
                  </form>
                )}

                {memberError && <p className="text-[#ba1a1a] text-xs mt-2">{memberError}</p>}
              </div>
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
                <div key={b.id} className="p-3 rounded-xl bg-[#f8f9ff]">
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
                    {Math.abs(b.balance) < 0.005 ? '✓ Settled' : b.balance > 0 ? `Is owed ₹${b.balance.toFixed(2)}` : `Owes ₹${Math.abs(b.balance).toFixed(2)}`}
                  </p>
                </div>
              ))}
              {balances.length === 0 && (
                <p className="text-sm text-[#727785] text-center py-4">Add members and expenses to see balances.</p>
              )}
            </div>
          </div>

          {/* Settle Up */}
          {settlements.length > 0 && (
            <div className="ocean-card rounded-2xl p-5">
              <h3 className="font-semibold text-[#0b1c30] text-base mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00628d]">currency_exchange</span>
                Settle Up
              </h3>
              <p className="text-xs text-[#727785] mb-4">Minimum transactions to clear all debts.</p>
              <div className="space-y-2.5">
                {settlements.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-[#f0f9ff] border border-[#bae6fd]">
                    <div className="w-7 h-7 rounded-full bg-[#ba1a1a]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#ba1a1a]">{s.from[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#424754]">
                        <span className="font-semibold text-[#0b1c30]">{s.from}</span>
                        <span className="mx-1">pays</span>
                        <span className="font-semibold text-[#0b1c30]">{s.to}</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#00628d] flex-shrink-0">₹{s.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Add Expense Form */}
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
                  <input type="text" value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder='e.g., Dinner at beach shack' className="form-input" />
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
                      <option key={m.id} value={m.id}>
                        {m.name}{m.id === userId ? ' (You)' : ''}{m.isGuest ? ' 👤' : ''}
                      </option>
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

          {/* Expense List */}
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
                            {expense.expense_date
                              ? new Date(expense.expense_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : new Date(expense.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-bold text-[#0b1c30] text-lg">₹{Number(expense.amount).toFixed(2)}</p>
                      {(expense.created_by === userId || isCreator) && (
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={deleteExpId === expense.id}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors disabled:opacity-50"
                        >
                          {deleteExpId === expense.id
                            ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                            : <span className="material-symbols-outlined text-lg">delete</span>
                          }
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
