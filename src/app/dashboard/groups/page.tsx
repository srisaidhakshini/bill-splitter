'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';

interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  memberCount?: number;
  totalExpenses?: number;
}

const GROUP_ICON_COLORS = [
  'from-[#0058be] to-[#4059aa]',
  'from-[#00628d] to-[#007cb1]',
  'from-[#4059aa] to-[#8fa7fe]',
  'from-[#213145] to-[#0058be]',
];

const GROUP_ICONS = ['home', 'map', 'restaurant', 'flight', 'shopping_bag', 'sports_soccer'];

export default function GroupsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [createdGroups, setCreatedGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadGroups = useCallback(async (uid: string) => {
    const supabase = createClient();
    // Load groups created by user
    const { data: created } = await supabase
      .from('groups')
      .select('*')
      .eq('created_by', uid)
      .order('created_at', { ascending: false });

    // Load groups user is member of (not creator)
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', uid);

    const memberGroupIds = (memberships || []).map(m => m.group_id);
    const createdIds = new Set((created || []).map(g => g.id));
    const joinedIds = memberGroupIds.filter(id => !createdIds.has(id));

    let joined: Group[] = [];
    if (joinedIds.length > 0) {
      const { data: joinedData } = await supabase
        .from('groups')
        .select('*')
        .in('id', joinedIds)
        .order('created_at', { ascending: false });
      joined = joinedData || [];
    }

    // Enrich with member count and total expenses
    const enriched = async (groups: Group[]) => {
      return Promise.all(groups.map(async g => {
        const [membersRes, expensesRes] = await Promise.all([
          supabase.from('group_members').select('id', { count: 'exact' }).eq('group_id', g.id),
          supabase.from('group_expenses').select('amount').eq('group_id', g.id),
        ]);
        const totalExpenses = (expensesRes.data || []).reduce((s, e) => s + Number(e.amount), 0);
        return { ...g, memberCount: membersRes.count || 0, totalExpenses };
      }));
    };

    const [enrichedCreated, enrichedJoined] = await Promise.all([
      enriched(created || []),
      enriched(joined),
    ]);

    setCreatedGroups(enrichedCreated);
    setJoinedGroups(enrichedJoined);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      loadGroups(user.id).finally(() => setLoading(false));
    });
  }, [router, loadGroups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!groupName.trim()) { setFormError('Please enter a group name.'); return; }

    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), created_by: userId })
      .select()
      .single();

    if (error || !data) {
      setFormError('We could not create the group. Please try again.');
      setCreating(false);
      return;
    }

    // Add creator as member
    await supabase.from('group_members').insert({ group_id: data.id, user_id: userId });

    setGroupName('');
    await loadGroups(userId);
    showToast('Group created successfully.');
    setCreating(false);
  };

  const handleDeleteGroup = async (id: string) => {
    setDeleteId(id);
    setConfirmDeleteId(null);
    const supabase = createClient();
    // Delete in order: expenses → members → group
    await supabase.from('group_expenses').delete().eq('group_id', id);
    await supabase.from('group_members').delete().eq('group_id', id);
    const { error } = await supabase.from('groups').delete().eq('id', id).eq('created_by', userId);
    if (error) {
      showToast('Could not delete group. Please try again.', 'error');
    } else {
      setCreatedGroups(prev => prev.filter(g => g.id !== id));
      showToast('Group and all its expenses have been deleted.');
    }
    setDeleteId(null);
  };

  const allGroups = [...createdGroups, ...joinedGroups];
  const mostRecentGroup = allGroups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-[#0058be] animate-pulse">group</span>
          <p className="text-[#424754] font-medium">Loading your groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16 md:pt-6 min-h-screen animate-fade-in">
      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#ba1a1a]">warning</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#0b1c30] text-lg">Delete Group?</h3>
                <p className="text-[#424754] text-sm mt-1">Deleting this group will also delete all expenses inside it. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-[#c2c6d6] text-[#424754] font-semibold text-sm hover:bg-[#f8f9ff] transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDeleteGroup(confirmDeleteId)}
                disabled={deleteId === confirmDeleteId}
                className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] text-white font-semibold text-sm hover:bg-[#ba1a1a]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteId === confirmDeleteId ? <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>Deleting...</> : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm toast-enter ${toast.type === 'success' ? 'bg-[#0058be]' : 'bg-[#ba1a1a]'}`}>
          <span className="material-symbols-outlined text-lg">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h2 className="font-bold text-[#0b1c30]" style={{ fontSize: '28px' }}>My Groups</h2>
        <p className="text-[#424754] mt-1 text-sm">Manage your shared expense groups</p>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Groups You Created', value: createdGroups.length, icon: 'add_circle', color: '#0058be', bg: '#d8e2ff' },
          { label: 'Groups You Joined', value: joinedGroups.length, icon: 'group_add', color: '#00628d', bg: '#c9e6ff' },
          { label: 'Total Groups', value: allGroups.length, icon: 'group', color: '#4059aa', bg: '#dce1ff' },
          { label: 'Most Recent Group', value: mostRecentGroup?.name || '—', icon: 'schedule', color: '#0058be', bg: '#e5eeff', isText: true },
        ].map(card => (
          <div key={card.label} className="stat-card flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#424754]">{card.label}</p>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <span className="material-symbols-outlined text-lg" style={{ color: card.color }}>{card.icon}</span>
              </div>
            </div>
            {(card as { isText?: boolean }).isText ? (
              <p className="font-bold text-[#0b1c30] text-base truncate">{card.value}</p>
            ) : (
              <p className="font-bold text-[#0b1c30]" style={{ fontSize: '28px' }}>{card.value}</p>
            )}
          </div>
        ))}
      </section>

      {/* Create Group Form */}
      <section className="ocean-card rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#d8e2ff] rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[#0058be] text-xl">group_add</span>
          </div>
          <h3 className="font-semibold text-[#0058be]" style={{ fontSize: '20px' }}>Create a New Group</h3>
        </div>
        <form onSubmit={handleCreateGroup} className="flex gap-3 flex-col sm:flex-row" noValidate>
          <div className="flex-1">
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder='e.g., "Goa Trip 2026" or "Flat Mates"'
              className="form-input"
            />
            {formError && <p className="text-[#ba1a1a] text-xs mt-1">{formError}</p>}
          </div>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 px-6 py-3 bg-[#0058be] text-white rounded-xl font-semibold text-sm hover:bg-[#0058be]/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap self-start"
          >
            {creating ? <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>Creating...</> : <><span className="material-symbols-outlined text-lg">add</span>Create Group</>}
          </button>
        </form>
      </section>

      {/* Groups You Created */}
      {createdGroups.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold text-[#0b1c30] text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0058be]">manage_accounts</span>
            Groups You Created
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {createdGroups.map((group, i) => (
              <div key={group.id} className="ocean-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${GROUP_ICON_COLORS[i % GROUP_ICON_COLORS.length]} flex items-center justify-center text-white shadow`}>
                      <span className="material-symbols-outlined text-2xl">{GROUP_ICONS[i % GROUP_ICONS.length]}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0b1c30]">{group.name}</h4>
                      <p className="text-xs text-[#727785]">{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#424754]">Total Expenses</span>
                  <span className="font-bold text-[#0b1c30]">₹{(group.totalExpenses || 0).toFixed(2)}</span>
                </div>
                <p className="text-xs text-[#727785]">Created {new Date(group.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

                <div className="flex gap-2 pt-2 border-t border-[#e5eeff]">
                  <Link
                    href={`/dashboard/groups/${group.id}`}
                    className="flex-1 py-2 bg-[#0058be] text-white text-center rounded-xl text-sm font-semibold hover:bg-[#0058be]/90 transition-colors"
                  >
                    Open Group
                  </Link>
                  <button
                    onClick={() => setConfirmDeleteId(group.id)}
                    className="px-3 py-2 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                    title="Delete group"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Groups You Joined */}
      {joinedGroups.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold text-[#0b1c30] text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4059aa]">groups</span>
            Groups You Joined
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {joinedGroups.map((group, i) => (
              <div key={group.id} className="ocean-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${GROUP_ICON_COLORS[(i + 2) % GROUP_ICON_COLORS.length]} flex items-center justify-center text-white shadow`}>
                    <span className="material-symbols-outlined text-2xl">{GROUP_ICONS[(i + 2) % GROUP_ICONS.length]}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#0b1c30]">{group.name}</h4>
                    <p className="text-xs text-[#727785]">{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p className="text-xs text-[#727785]">Joined {new Date(group.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <Link
                  href={`/dashboard/groups/${group.id}`}
                  className="py-2 bg-[#eff4ff] border border-[#adc6ff] text-[#0058be] text-center rounded-xl text-sm font-semibold hover:bg-[#dce9ff] transition-colors"
                >
                  Open Group
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {allGroups.length === 0 && (
        <div className="ocean-card rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-[#c2c6d6] block mb-3">group</span>
          <p className="text-[#424754] font-medium">No groups yet.</p>
          <p className="text-[#727785] text-sm mt-1">Create your first group above or ask a friend to add you!</p>
        </div>
      )}
    </div>
  );
}
