import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useExpenses } from './ExpenseContext';
import {
  Group,
  GroupMember,
  GroupExpense,
  GroupExpenseSplit,
  GroupMetricSummary,
  GroupMemberSummary,
  GroupSettlement,
  SplitType,
  Profile,
} from '../types';
import {
  getAllLocalGroups,
  saveLocalGroup,
  saveLocalGroups,
  deleteLocalGroup,
  getLocalGroupMembers,
  saveLocalGroupMembers,
  getLocalGroupExpenses,
  saveLocalGroupExpense,
  saveLocalGroupExpenses,
  deleteLocalGroupExpense,
  saveLocalExpenseSplits,
  enqueueSyncItem,
  getPendingSyncQueue,
  removeSyncItem,
} from '../lib/db';
import {
  calculateGroupMetrics,
  calculateMemberSummaries,
  calculatePairwiseSettlements,
  computeSplitAllocations,
} from '../lib/groupCalculations';

interface GroupContextType {
  groups: Group[];
  activeGroup: Group | null;
  groupMembers: GroupMember[];
  groupExpenses: GroupExpense[];
  groupSplits: GroupExpenseSplit[];
  metrics: GroupMetricSummary;
  memberSummaries: GroupMemberSummary[];
  settlements: GroupSettlement[];
  isAdmin: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  isLoading: boolean;
  setActiveGroupId: (groupId: string | null) => void;
  createGroup: (name: string, description?: string, currency?: string) => Promise<{ group: Group | null; error: Error | null }>;
  joinGroup: (joinCode: string) => Promise<{ group: Group | null; error: Error | null }>;
  leaveGroup: (groupId: string) => Promise<{ error: Error | null }>;
  removeMember: (groupId: string, userId: string) => Promise<{ error: Error | null }>;
  updateMemberRole: (groupId: string, userId: string, newRole: 'admin' | 'member') => Promise<{ error: Error | null }>;
  deleteGroup: (groupId: string) => Promise<{ error: Error | null }>;
  addGroupExpense: (
    expenseData: {
      title: string;
      amount: number;
      category: string;
      paid_by: string;
      split_type: SplitType;
      expense_date: string;
      notes?: string;
    },
    customAllocations?: Record<string, number>
  ) => Promise<{ expense: GroupExpense | null; error: Error | null }>;
  updateGroupExpense: (
    expenseId: string,
    updates: Partial<GroupExpense>,
    customAllocations?: Record<string, number>
  ) => Promise<{ error: Error | null }>;
  deleteGroupExpense: (expenseId: string) => Promise<{ error: Error | null }>;
  settleExpenseSplit: (splitId: string) => Promise<{ error: Error | null }>;
  syncPendingQueue: () => Promise<void>;
  refreshGroupData: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

function generateJoinCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'EXP-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate Demo Groups Data for Instant Offline / Guest Previews
function generateDemoGroups(currentUserId: string, currentUserName: string, userCurrency: string) {
  const g1Id = 'demo-group-trip';
  const g2Id = 'demo-group-flat';

  const demoGroups: Group[] = [
    {
      id: g1Id,
      name: 'Goa Weekend Trip',
      description: 'Beach resort, scooty rentals, seafood & parties',
      currency: userCurrency || '₹',
      join_code: 'EXP-GOA7',
      created_by: currentUserId,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      member_count: 4,
      sync_status: 'synced',
    },
    {
      id: g2Id,
      name: 'Flat 402 Shared Living',
      description: 'Groceries, high-speed WiFi, domestic bills & maid',
      currency: userCurrency || '₹',
      join_code: 'EXP-FLAT',
      created_by: 'demo-user-priya',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      member_count: 3,
      sync_status: 'synced',
    },
  ];

  const demoMembers: Record<string, GroupMember[]> = {
    [g1Id]: [
      {
        id: 'gm-1',
        group_id: g1Id,
        user_id: currentUserId,
        role: 'admin',
        joined_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        profile: { id: currentUserId, email: 'you@expensetracker.app', full_name: currentUserName || 'You', currency: userCurrency || '₹', pin_hash: null, biometric_enabled: false, biometric_credential_id: null },
      },
      {
        id: 'gm-2',
        group_id: g1Id,
        user_id: 'demo-user-rohit',
        role: 'member',
        joined_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        profile: { id: 'demo-user-rohit', email: 'rohit.sharma@example.com', full_name: 'Rohit Sharma', currency: userCurrency || '₹', pin_hash: null, biometric_enabled: false, biometric_credential_id: null },
      },
      {
        id: 'gm-3',
        group_id: g1Id,
        user_id: 'demo-user-sneha',
        role: 'member',
        joined_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        profile: { id: 'demo-user-sneha', email: 'sneha.patel@example.com', full_name: 'Sneha Patel', currency: userCurrency || '₹', pin_hash: null, biometric_enabled: false, biometric_credential_id: null },
      },
      {
        id: 'gm-4',
        group_id: g1Id,
        user_id: 'demo-user-arjun',
        role: 'member',
        joined_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        profile: { id: 'demo-user-arjun', email: 'arjun.verma@example.com', full_name: 'Arjun Verma', currency: userCurrency || '₹', pin_hash: null, biometric_enabled: false, biometric_credential_id: null },
      },
    ],
    [g2Id]: [
      {
        id: 'gm-5',
        group_id: g2Id,
        user_id: currentUserId,
        role: 'member',
        joined_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        profile: { id: currentUserId, email: 'you@expensetracker.app', full_name: currentUserName || 'You', currency: userCurrency || '₹', pin_hash: null, biometric_enabled: false, biometric_credential_id: null },
      },
      {
        id: 'gm-6',
        group_id: g2Id,
        user_id: 'demo-user-priya',
        role: 'admin',
        joined_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        profile: { id: 'demo-user-priya', email: 'priya.singh@example.com', full_name: 'Priya Singh', currency: userCurrency || '₹', pin_hash: null, biometric_enabled: false, biometric_credential_id: null },
      },
      {
        id: 'gm-7',
        group_id: g2Id,
        user_id: 'demo-user-karan',
        role: 'member',
        joined_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        profile: { id: 'demo-user-karan', email: 'karan.mehta@example.com', full_name: 'Karan Mehta', currency: userCurrency || '₹', pin_hash: null, biometric_enabled: false, biometric_credential_id: null },
      },
    ],
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const demoExpenses: Record<string, GroupExpense[]> = {
    [g1Id]: [
      {
        id: 'gexp-1',
        group_id: g1Id,
        paid_by: currentUserId,
        amount: 8400,
        title: 'Beachside Villa Stay & Breakfast',
        category: 'Rent',
        split_type: 'equal',
        expense_date: todayStr,
        notes: '2 Nights booking through Airbnb',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        sync_status: 'synced',
      },
      {
        id: 'gexp-2',
        group_id: g1Id,
        paid_by: 'demo-user-rohit',
        amount: 3200,
        title: 'Shack Dinner & Refreshments',
        category: 'Party/Dining',
        split_type: 'equal',
        expense_date: todayStr,
        notes: 'Candolim beach live music shack',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        sync_status: 'synced',
      },
      {
        id: 'gexp-3',
        group_id: g1Id,
        paid_by: 'demo-user-sneha',
        amount: 1600,
        title: 'Scooty Rentals & Fuel',
        category: 'Transport',
        split_type: 'equal',
        expense_date: todayStr,
        notes: '4 Activa bikes for 2 days',
        created_at: new Date().toISOString(),
        sync_status: 'synced',
      },
    ],
  };

  const demoSplits: Record<string, GroupExpenseSplit[]> = {
    [g1Id]: [
      // gexp-1 (8400 / 4 = 2100 each)
      { id: 's-1', group_expense_id: 'gexp-1', user_id: currentUserId, owed_amount: 2100, settled: false },
      { id: 's-2', group_expense_id: 'gexp-1', user_id: 'demo-user-rohit', owed_amount: 2100, settled: false },
      { id: 's-3', group_expense_id: 'gexp-1', user_id: 'demo-user-sneha', owed_amount: 2100, settled: false },
      { id: 's-4', group_expense_id: 'gexp-1', user_id: 'demo-user-arjun', owed_amount: 2100, settled: false },
      // gexp-2 (3200 / 4 = 800 each)
      { id: 's-5', group_expense_id: 'gexp-2', user_id: currentUserId, owed_amount: 800, settled: false },
      { id: 's-6', group_expense_id: 'gexp-2', user_id: 'demo-user-rohit', owed_amount: 800, settled: false },
      { id: 's-7', group_expense_id: 'gexp-2', user_id: 'demo-user-sneha', owed_amount: 800, settled: false },
      { id: 's-8', group_expense_id: 'gexp-2', user_id: 'demo-user-arjun', owed_amount: 800, settled: false },
      // gexp-3 (1600 / 4 = 400 each)
      { id: 's-9', group_expense_id: 'gexp-3', user_id: currentUserId, owed_amount: 400, settled: false },
      { id: 's-10', group_expense_id: 'gexp-3', user_id: 'demo-user-rohit', owed_amount: 400, settled: false },
      { id: 's-11', group_expense_id: 'gexp-3', user_id: 'demo-user-sneha', owed_amount: 400, settled: false },
      { id: 's-12', group_expense_id: 'gexp-3', user_id: 'demo-user-arjun', owed_amount: 400, settled: false },
    ],
  };

  return { demoGroups, demoMembers, demoExpenses, demoSplits };
}

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isDemoMode } = useAuth();
  const { addToast } = useExpenses();

  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [groupSplits, setGroupSplits] = useState<GroupExpenseSplit[]>([]);

  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const currentUserId = user?.id || 'demo-user-12345';
  const currentUserName = profile?.full_name || 'You';
  const userCurrency = profile?.currency || '₹';

  // Active Group object
  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || null;
  }, [groups, activeGroupId]);

  // Derived Metrics & Calculations
  const metrics: GroupMetricSummary = useMemo(() => {
    return calculateGroupMetrics(groupExpenses, groupSplits, groupMembers, currentUserId);
  }, [groupExpenses, groupSplits, groupMembers, currentUserId]);

  const memberSummaries: GroupMemberSummary[] = useMemo(() => {
    return calculateMemberSummaries(groupExpenses, groupSplits, groupMembers);
  }, [groupExpenses, groupSplits, groupMembers]);

  const settlements: GroupSettlement[] = useMemo(() => {
    return calculatePairwiseSettlements(groupExpenses, groupSplits, groupMembers);
  }, [groupExpenses, groupSplits, groupMembers]);

  // Computed: whether the current user is admin or creator of active group
  const isAdmin = useMemo(() => {
    if (!activeGroup || !currentUserId) return false;
    if (activeGroup.created_by === currentUserId) return true;
    const currentMember = groupMembers.find((m) => m.user_id === currentUserId);
    return currentMember?.role === 'admin';
  }, [activeGroup, currentUserId, groupMembers]);

  // Update pending queue count
  const refreshPendingCount = useCallback(async () => {
    try {
      const queue = await getPendingSyncQueue();
      setPendingSyncCount(queue.length);
    } catch {
      // IndexedDB might not be supported in some environments
    }
  }, []);

  // Flush Pending Sync Queue to Supabase sequentially
  const syncPendingQueue = useCallback(async () => {
    if (!isOnline || isSyncing || !isSupabaseConfigured || isDemoMode) return;

    try {
      setIsSyncing(true);
      const queue = await getPendingSyncQueue();
      if (queue.length === 0) {
        setIsSyncing(false);
        setPendingSyncCount(0);
        return;
      }

      for (const item of queue) {
        try {
          if (item.action === 'create_group') {
            const payload = item.payload;
            const { error } = await supabase.from('groups').insert({
              id: payload.id,
              name: payload.name,
              description: payload.description,
              currency: payload.currency,
              join_code: payload.join_code,
              created_by: payload.created_by,
            });
            if (error && error.code !== '23505') throw error;
            // Also insert admin membership
            await supabase.from('group_members').insert({
              group_id: payload.id,
              user_id: payload.created_by,
              role: 'admin',
            });
            await removeSyncItem(item.id);
          } else if (item.action === 'create_expense') {
            const payload = item.payload as GroupExpense;
            const splits = (payload.splits || []) as GroupExpenseSplit[];

            // Insert expense
            const { error: expErr } = await supabase.from('group_expenses').insert({
              id: payload.id,
              group_id: payload.group_id,
              paid_by: payload.paid_by,
              amount: payload.amount,
              title: payload.title,
              category: payload.category,
              split_type: payload.split_type,
              expense_date: payload.expense_date,
              notes: payload.notes,
            });
            if (expErr && expErr.code !== '23505') throw expErr;

            // Insert splits
            if (splits.length > 0) {
              const { error: splitErr } = await supabase.from('group_expense_splits').insert(
                splits.map((s) => ({
                  id: s.id,
                  group_expense_id: payload.id,
                  user_id: s.user_id,
                  owed_amount: s.owed_amount,
                  settled: s.settled,
                }))
              );
              if (splitErr && splitErr.code !== '23505') throw splitErr;
            }

            // Update local state to mark synced
            setGroupExpenses((prev) =>
              prev.map((e) => (e.id === payload.id ? { ...e, sync_status: 'synced' } : e))
            );
            await removeSyncItem(item.id);
          } else if (item.action === 'update_expense') {
            const payload = item.payload;
            const { error } = await supabase
              .from('group_expenses')
              .update({
                title: payload.title,
                amount: payload.amount,
                category: payload.category,
                split_type: payload.split_type,
                expense_date: payload.expense_date,
                notes: payload.notes,
                updated_at: new Date().toISOString(),
              })
              .eq('id', payload.id);
            if (error) throw error;
            await removeSyncItem(item.id);
          } else if (item.action === 'delete_expense') {
            const { error } = await supabase.from('group_expenses').delete().eq('id', item.payload.id);
            if (error) throw error;
            await removeSyncItem(item.id);
          } else if (item.action === 'settle_split') {
            const { error } = await supabase
              .from('group_expense_splits')
              .update({ settled: true })
              .eq('id', item.payload.id);
            if (error) throw error;
            await removeSyncItem(item.id);
          }
        } catch (itemErr: any) {
          console.error('Error syncing queue item:', item.action, itemErr);
          // If record already exists or duplicate key error, safely remove from queue
          if (itemErr?.code === '23505' || itemErr?.message?.includes('duplicate key') || itemErr?.message?.includes('already exists')) {
            await removeSyncItem(item.id);
          }
        }
      }

      const remainingQueue = await getPendingSyncQueue();
      setPendingSyncCount(remainingQueue.length);
      if (remainingQueue.length === 0 && queue.length > 0) {
        addToast({
          type: 'success',
          title: 'All Changes Synchronized',
          message: 'Your offline group changes were uploaded to the cloud.',
        });
      }
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, isDemoMode, addToast]);

  // Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast({
        type: 'info',
        title: 'Back Online',
        message: 'Syncing pending group transactions with cloud...',
      });
      syncPendingQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        type: 'warning',
        title: 'Offline Mode Active',
        message: 'You can continue logging expenses. They will sync automatically when reconnected.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingQueue, addToast]);

  // Load User Groups from Supabase or IndexedDB Cache / Demo
  const refreshGroupData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isDemoMode || !isSupabaseConfigured) {
        const { demoGroups } = generateDemoGroups(currentUserId, currentUserName, userCurrency);
        const cached = await getAllLocalGroups();
        if (cached.length > 0) {
          setGroups(cached);
          if (!activeGroupId && cached.length > 0) setActiveGroupId(cached[0].id);
        } else {
          setGroups(demoGroups);
          await saveLocalGroups(demoGroups);
          if (!activeGroupId && demoGroups.length > 0) setActiveGroupId(demoGroups[0].id);
        }
        setIsLoading(false);
        return;
      }

      // Fetch from Supabase
      if (user) {
        // Query groups where user is a member or creator
        const { data: memberRows, error: memberErr } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (memberErr) throw memberErr;

        const groupIds = (memberRows || []).map((r) => r.group_id);

        // Auto-sync any locally created groups not yet on Supabase
        const cached = await getAllLocalGroups();
        const missingOnServer = cached.filter(
          (cg) => cg.created_by === user.id && !groupIds.includes(cg.id)
        );
        for (const localG of missingOnServer) {
          try {
            const { error: gInsErr } = await supabase.from('groups').insert({
              id: localG.id,
              name: localG.name,
              description: localG.description,
              currency: localG.currency,
              join_code: localG.join_code,
              invite_code: localG.join_code,
              created_by: user.id,
            });
            if (!gInsErr || gInsErr.code === '23505') {
              await supabase.from('group_members').insert({
                group_id: localG.id,
                user_id: user.id,
                role: 'admin',
              });
              groupIds.push(localG.id);
            }
          } catch (syncErr) {
            console.warn('Auto-sync local group to Supabase notice:', syncErr);
          }
        }

        if (groupIds.length > 0) {
          const [groupsRes, membersRes] = await Promise.all([
            supabase
              .from('groups')
              .select('*')
              .in('id', groupIds)
              .order('created_at', { ascending: false }),
            supabase
              .from('group_members')
              .select('group_id, user_id')
              .in('group_id', groupIds),
          ]);

          if (groupsRes.error) throw groupsRes.error;

          const countMap = (membersRes.data || []).reduce<Record<string, number>>((acc, m) => {
            acc[m.group_id] = (acc[m.group_id] || 0) + 1;
            return acc;
          }, {});

          if (groupsRes.data) {
            const formatted = groupsRes.data.map((g) => ({
              ...g,
              member_count: countMap[g.id] || 1,
              sync_status: 'synced' as const,
            }));
            setGroups(formatted);
            await saveLocalGroups(formatted);
            if (!activeGroupId && formatted.length > 0) setActiveGroupId(formatted[0].id);
          }
        } else {
          setGroups([]);
        }
      }
    } catch (err) {
      console.warn('Falling back to local IndexedDB cache for groups:', err);
      const cached = await getAllLocalGroups();
      setGroups(cached);
      if (!activeGroupId && cached.length > 0) setActiveGroupId(cached[0].id);
    } finally {
      setIsLoading(false);
      refreshPendingCount();
    }
  }, [user, isDemoMode, currentUserId, currentUserName, userCurrency, activeGroupId, refreshPendingCount]);

  // Load Active Group Details (Members, Expenses, Splits)
  useEffect(() => {
    if (!activeGroupId) {
      setGroupMembers([]);
      setGroupExpenses([]);
      setGroupSplits([]);
      return;
    }

    let isMounted = true;

    async function loadActiveGroupDetails() {
      try {
        if (isDemoMode || !isSupabaseConfigured) {
          const { demoMembers, demoExpenses, demoSplits } = generateDemoGroups(
            currentUserId,
            currentUserName,
            userCurrency
          );
          const localMembers = await getLocalGroupMembers(activeGroupId!);
          const localExpenses = await getLocalGroupExpenses(activeGroupId!);

          if (isMounted) {
            setGroupMembers(localMembers.length > 0 ? localMembers : demoMembers[activeGroupId!] || []);
            setGroupExpenses(localExpenses.length > 0 ? localExpenses : demoExpenses[activeGroupId!] || []);
            setGroupSplits(demoSplits[activeGroupId!] || []);
          }
          return;
        }

        // 1. Fetch group members (RPC first, direct table query fallback)
        let membersData: GroupMember[] = [];
        try {
          const { data: rpcMembers, error: rpcErr } = await supabase.rpc('get_group_members', {
            p_group_id: activeGroupId,
          });

          if (!rpcErr && rpcMembers && rpcMembers.length > 0) {
            membersData = rpcMembers.map((m: any) => ({
              id: m.id,
              group_id: m.group_id,
              user_id: m.user_id,
              role: (m.role as 'admin' | 'member') || 'member',
              joined_at: m.joined_at,
              profile: {
                id: m.user_id,
                email: m.email || 'member@expensetracker.app',
                full_name: m.full_name || 'Member',
                currency: m.currency || userCurrency,
                pin_hash: null,
                biometric_enabled: false,
                biometric_credential_id: null,
              },
            }));
          }
        } catch (rpcCatch) {
          console.warn('get_group_members RPC notice, using table fallback:', rpcCatch);
        }

        // Direct table fallback if RPC didn't return members
        if (membersData.length === 0) {
          const { data: membersRaw } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', activeGroupId);

          const userIds = (membersRaw || []).map((m) => m.user_id);
          let profilesMap: Record<string, Profile> = {};

          if (userIds.length > 0) {
            const { data: profData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', userIds);

            (profData || []).forEach((p) => {
              profilesMap[p.id] = p;
            });
          }

          membersData = (membersRaw || []).map((m) => ({
            ...m,
            profile: profilesMap[m.user_id] || {
              id: m.user_id,
              email: 'member@expensetracker.app',
              full_name: 'Member',
              currency: userCurrency,
              pin_hash: null,
              biometric_enabled: false,
              biometric_credential_id: null,
            },
          }));
        }

        // Defensive fallback: If still empty, inject current user so UI never breaks
        if (membersData.length === 0 && currentUserId) {
          membersData = [
            {
              id: generateUUID(),
              group_id: activeGroupId!,
              user_id: currentUserId,
              role: 'admin',
              joined_at: new Date().toISOString(),
              profile: {
                id: currentUserId,
                email: user?.email || 'you@expensetracker.app',
                full_name: currentUserName || 'You',
                currency: userCurrency,
                pin_hash: null,
                biometric_enabled: false,
                biometric_credential_id: null,
              },
            },
          ];
        }

        // Build quick lookup map of profiles from membersData
        const membersMap: Record<string, Profile | undefined> = {};
        membersData.forEach((m) => {
          if (m.profile) membersMap[m.user_id] = m.profile;
        });

        // 2. Fetch group expenses & splits
        const { data: expensesRaw, error: expErr } = await supabase
          .from('group_expenses')
          .select('*')
          .eq('group_id', activeGroupId!)
          .order('expense_date', { ascending: false });

        if (expErr) throw expErr;

        const expenseIds = (expensesRaw || []).map((e) => e.id);
        let splitsData: GroupExpenseSplit[] = [];

        if (expenseIds.length > 0) {
          const { data: splitsRaw } = await supabase
            .from('group_expense_splits')
            .select('*')
            .in('group_expense_id', expenseIds);

          splitsData = (splitsRaw || []).map((s) => ({
            ...s,
            user_profile: membersMap[s.user_id],
          }));
        }

        const formattedExpenses: GroupExpense[] = (expensesRaw || []).map((e) => ({
          ...e,
          sync_status: 'synced' as const,
          payer_profile: membersMap[e.paid_by],
          splits: splitsData.filter((s) => s.group_expense_id === e.id),
        }));

        if (isMounted) {
          setGroupMembers(membersData);
          setGroupExpenses(formattedExpenses);
          setGroupSplits(splitsData);

          // Update local IndexedDB cache
          await saveLocalGroupMembers(membersData);
          await saveLocalGroupExpenses(formattedExpenses);
        }
      } catch (err) {
        console.warn('Loading group details from local IndexedDB fallback:', err);
        const localMembers = await getLocalGroupMembers(activeGroupId!);
        const localExpenses = await getLocalGroupExpenses(activeGroupId!);
        if (isMounted) {
          setGroupMembers(localMembers);
          setGroupExpenses(localExpenses);
        }
      }
    }

    loadActiveGroupDetails();

    // Supabase Realtime Subscription for Live Collaborative Updates
    let channel: any = null;
    if (isSupabaseConfigured && !isDemoMode && activeGroupId) {
      channel = supabase
        .channel(`group-live-room-${activeGroupId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${activeGroupId}` },
          () => {
            loadActiveGroupDetails();
            refreshGroupData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_expenses', filter: `group_id=eq.${activeGroupId}` },
          () => {
            loadActiveGroupDetails();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_expense_splits' },
          () => {
            loadActiveGroupDetails();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${activeGroupId}` },
          () => {
            refreshGroupData();
            loadActiveGroupDetails();
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeGroupId, user, isDemoMode, currentUserId, currentUserName, userCurrency, refreshGroupData]);

  // Global Realtime Subscription for user's group memberships
  useEffect(() => {
    if (!isSupabaseConfigured || isDemoMode || !user) return;
    const userMembershipsChannel = supabase
      .channel(`user-memberships-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` },
        () => {
          refreshGroupData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userMembershipsChannel);
    };
  }, [user, isDemoMode, refreshGroupData]);

  // Initial Load on mount or auth change + Flush Queue
  useEffect(() => {
    refreshGroupData();
    if (isOnline && isSupabaseConfigured && !isDemoMode) {
      syncPendingQueue();
    }
  }, [refreshGroupData, isOnline, syncPendingQueue, isDemoMode]);

  // CRUD: Create Group
  const createGroup = async (
    name: string,
    description?: string,
    currency: string = '₹'
  ): Promise<{ group: Group | null; error: Error | null }> => {
    const newId = generateUUID();
    const joinCode = generateJoinCode();
    const nowStr = new Date().toISOString();

    const newGroup: Group = {
      id: newId,
      name,
      description: description || null,
      currency: currency || '₹',
      join_code: joinCode,
      created_by: currentUserId,
      created_at: nowStr,
      updated_at: nowStr,
      member_count: 1,
      sync_status: isOnline && isSupabaseConfigured && !isDemoMode ? 'synced' : 'pending',
    };

    const creatorMember: GroupMember = {
      id: generateUUID(),
      group_id: newId,
      user_id: currentUserId,
      role: 'admin',
      joined_at: nowStr,
      profile: {
        id: currentUserId,
        email: user?.email || 'you@expensetracker.app',
        full_name: currentUserName,
        currency,
        pin_hash: null,
        biometric_enabled: false,
        biometric_credential_id: null,
      },
    };

    // Optimistic state update
    const updatedGroups = [newGroup, ...groups];
    setGroups(updatedGroups);
    setActiveGroupId(newId);

    // Save to IndexedDB
    await saveLocalGroup(newGroup);
    await saveLocalGroupMembers([creatorMember]);

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({
        type: 'success',
        title: 'Group Created',
        message: `"${name}" group created. Share join code ${joinCode} with members.`,
      });
      return { group: newGroup, error: null };
    }

    if (!isOnline) {
      // Enqueue sync mutation
      await enqueueSyncItem({
        id: generateUUID(),
        temp_id: newId,
        action: 'create_group',
        entity: 'group',
        payload: newGroup,
        status: 'pending',
        created_at: nowStr,
        retry_count: 0,
      });
      await refreshPendingCount();
      addToast({
        type: 'info',
        title: 'Created Offline (Queued)',
        message: `Group created locally. It will sync automatically when back online.`,
      });
      return { group: newGroup, error: null };
    }

    try {
      const { data, error } = await supabase.rpc('create_group_with_admin', {
        p_name: name,
        p_description: description || null,
        p_currency: currency,
        p_join_code: joinCode,
      });

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Group Created',
        message: `"${name}" is ready. Share invite code ${data.join_code} with friends.`,
      });
      return { group: data as Group, error: null };
    } catch (err: unknown) {
      console.error('Supabase create_group RPC error, trying direct table insert:', err);
      // Fallback direct table inserts
      try {
        const { error: gErr } = await supabase.from('groups').insert({
          id: newId,
          name,
          description: description || null,
          currency,
          join_code: joinCode,
          invite_code: joinCode,
          created_by: currentUserId,
        });
        if (gErr) throw gErr;

        const { error: memErr } = await supabase.from('group_members').insert({
          group_id: newId,
          user_id: currentUserId,
          role: 'admin',
        });
        if (memErr && memErr.code !== '23505') throw memErr;

        await refreshGroupData();
        addToast({
          type: 'success',
          title: 'Group Created',
          message: `"${name}" created with invite code ${joinCode}.`,
        });
        return { group: newGroup, error: null };
      } catch (fallbackErr) {
        console.warn('Network/Supabase notice during group creation, saved locally in offline queue:', fallbackErr);
        await enqueueSyncItem({
          id: generateUUID(),
          temp_id: newId,
          action: 'create_group',
          entity: 'group',
          payload: newGroup,
          status: 'pending',
          created_at: nowStr,
          retry_count: 0,
        });
        await refreshPendingCount();
        addToast({
          type: 'info',
          title: 'Group Created',
          message: `"${name}" is ready with invite code ${joinCode}. Changes saved locally and will sync to cloud.`,
        });
        return { group: newGroup, error: null };
      }
    }
  };

  // CRUD: Join Group by Code (with case, whitespace, and prefix tolerance)
  const joinGroup = async (joinCode: string): Promise<{ group: Group | null; error: Error | null }> => {
    const rawInput = joinCode.trim().toUpperCase();
    if (!rawInput) {
      return { group: null, error: new Error('Please enter a valid join code') };
    }

    // Strip optional EXP- prefix and clean whitespace/hyphens
    const strippedCode = rawInput.replace(/^EXP[-_ ]?/i, '');
    const standardPrefixCode = `EXP-${strippedCode}`;

    if (isDemoMode || !isSupabaseConfigured) {
      // Find or create in demo mode with prefix tolerance
      let target = groups.find((g) => {
        const gCode = g.join_code.trim().toUpperCase();
        const gStripped = gCode.replace(/^EXP[-_ ]?/i, '');
        return gCode === rawInput || gCode === standardPrefixCode || gStripped === strippedCode;
      });

      if (!target) {
        target = {
          id: generateUUID(),
          name: `Shared Group (${standardPrefixCode})`,
          description: 'Collaborative group space',
          currency: userCurrency,
          join_code: standardPrefixCode,
          created_by: 'demo-creator',
          created_at: new Date().toISOString(),
          member_count: 2,
          sync_status: 'synced',
        };
        const updated = [target, ...groups];
        setGroups(updated);
        await saveLocalGroup(target);
      }
      setActiveGroupId(target.id);
      addToast({
        type: 'success',
        title: 'Joined Group',
        message: `Successfully joined "${target.name}".`,
      });
      return { group: target, error: null };
    }

    try {
      // 1. Primary RPC Call using SECURITY DEFINER stored procedure
      let rpcData: any = null;
      let rpcError: any = null;

      try {
        const { data, error } = await supabase.rpc('join_group_by_code', {
          p_code: rawInput,
        });
        rpcData = data;
        rpcError = error;
      } catch (rpcCallErr) {
        console.warn('join_group_by_code RPC network or execution notice:', rpcCallErr);
        rpcError = rpcCallErr;
      }

      if (!rpcError && rpcData) {
        const joinedGroup: Group = {
          id: rpcData.id,
          name: rpcData.name,
          description: rpcData.description || null,
          currency: rpcData.currency || '₹',
          join_code: rpcData.join_code,
          created_by: rpcData.created_by,
          created_at: rpcData.created_at,
          sync_status: 'synced',
          member_count: rpcData.members ? rpcData.members.length : 1,
        };

        // Cache in state and IndexedDB immediately
        setGroups((prev) => [joinedGroup, ...prev.filter((g) => g.id !== joinedGroup.id)]);
        await saveLocalGroup(joinedGroup);
        setActiveGroupId(joinedGroup.id);

        if (rpcData.members && Array.isArray(rpcData.members)) {
          setGroupMembers(rpcData.members);
          await saveLocalGroupMembers(rpcData.members);
        }

        await refreshGroupData();

        addToast({
          type: 'success',
          title: rpcData.already_member ? 'Switched to Group' : 'Joined Group!',
          message: rpcData.already_member
            ? `You are already a member of "${rpcData.name}".`
            : `You have successfully joined "${rpcData.name}".`,
        });
        return { group: joinedGroup, error: null };
      }

      // 2. Direct client query fallback (works if RPC was missing or experienced transient error)
      try {
        const { data: groupData, error: groupFetchErr } = await supabase
          .from('groups')
          .select('*')
          .or(`join_code.ilike.${standardPrefixCode},join_code.ilike.${rawInput},join_code.ilike.%${strippedCode}%,invite_code.ilike.${standardPrefixCode},invite_code.ilike.${rawInput}`)
          .limit(1)
          .maybeSingle();

        if (groupData && !groupFetchErr) {
          // Check if already a member
          const { data: existingMem } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupData.id)
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (!existingMem) {
            await supabase.from('group_members').insert({
              group_id: groupData.id,
              user_id: currentUserId,
              role: 'member',
            });
          }

          const joinedGroup: Group = {
            id: groupData.id,
            name: groupData.name,
            description: groupData.description || null,
            currency: groupData.currency || '₹',
            join_code: groupData.join_code,
            created_by: groupData.created_by,
            created_at: groupData.created_at,
            sync_status: 'synced',
            member_count: 2,
          };

          setGroups((prev) => [joinedGroup, ...prev.filter((g) => g.id !== joinedGroup.id)]);
          await saveLocalGroup(joinedGroup);
          setActiveGroupId(joinedGroup.id);
          await refreshGroupData();

          addToast({
            type: 'success',
            title: existingMem ? 'Switched to Group' : 'Joined Group!',
            message: existingMem
              ? `You are already a member of "${groupData.name}".`
              : `You have successfully joined "${groupData.name}".`,
          });
          return { group: joinedGroup, error: null };
        }
      } catch (fallbackQueryErr) {
        console.warn('Client fallback query network notice:', fallbackQueryErr);
      }

      // 3. Local IndexedDB Cache Lookup (In case group is already stored on device)
      const cachedGroups = await getAllLocalGroups();
      const localMatch = cachedGroups.find((g) => {
        const gCode = (g.join_code || '').trim().toUpperCase();
        const gStripped = gCode.replace(/^EXP[-_ ]?/i, '');
        return gCode === rawInput || gCode === standardPrefixCode || gStripped === strippedCode;
      });

      if (localMatch) {
        setActiveGroupId(localMatch.id);
        addToast({
          type: 'success',
          title: 'Switched to Group',
          message: `Opened "${localMatch.name}" from local storage.`,
        });
        return { group: localMatch, error: null };
      }

      // 4. Construct friendly user error message
      const isFetchErr =
        (rpcError as Error)?.message?.includes('Failed to fetch') ||
        rpcError instanceof TypeError;
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      let msg = `Invalid invite code (${rawInput}). No matching group found.`;
      if (isOffline) {
        msg = 'You are currently offline. Please check your internet connection and try again.';
      } else if (isFetchErr) {
        msg = 'Unable to connect to database. Please check your internet connection or verify Vercel environment variables.';
      } else if (rpcError?.message && rpcError.message.includes('No matching group found')) {
        msg = `Invalid invite code (${rawInput}). No matching group found.`;
      }

      addToast({ type: 'error', title: 'Could Not Join', message: msg });
      return { group: null, error: new Error(msg) };
    } catch (err: unknown) {
      const isFetchErr =
        (err as Error)?.message?.includes('Failed to fetch') || err instanceof TypeError;
      const msg = isFetchErr
        ? 'Unable to connect to database. Please check your network connection.'
        : (err as Error).message || 'Invalid join code. Could not join group.';

      addToast({ type: 'error', title: 'Join Failed', message: msg });
      return { group: null, error: new Error(msg) };
    }
  };

  // CRUD: Leave Group (Member voluntarily leaves)
  const leaveGroup = async (groupId: string): Promise<{ error: Error | null }> => {
    const targetGroup = groups.find((g) => g.id === groupId);
    const groupName = targetGroup ? targetGroup.name : 'Group';

    const updated = groups.filter((g) => g.id !== groupId);
    setGroups(updated);
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
    await deleteLocalGroup(groupId);

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({ type: 'info', title: 'Left Group', message: `You have left "${groupName}".` });
      return { error: null };
    }

    try {
      // 1. Attempt leave_group RPC
      const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
      if (error) {
        // Fallback direct delete from group_members
        const { error: fallbackErr } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', currentUserId);
        if (fallbackErr) throw fallbackErr;
      }

      await refreshGroupData();
      addToast({ type: 'info', title: 'Left Group', message: `You left "${groupName}".` });
      return { error: null };
    } catch (err: unknown) {
      console.error('Error leaving group:', err);
      return { error: err as Error };
    }
  };

  // CRUD: Remove Member (Admin kicks out a member)
  const removeMember = async (groupId: string, userId: string): Promise<{ error: Error | null }> => {
    // Optimistic UI update
    setGroupMembers((prev) => prev.filter((m) => m.user_id !== userId));

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({ type: 'success', title: 'Member Removed', message: 'Member was removed from the group.' });
      return { error: null };
    }

    try {
      // 1. Attempt remove_group_member RPC
      const { error } = await supabase.rpc('remove_group_member', {
        p_group_id: groupId,
        p_target_user_id: userId,
      });

      if (error) {
        // Fallback direct delete
        const { error: fallbackErr } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', userId);
        if (fallbackErr) throw fallbackErr;
      }

      await refreshGroupData();
      addToast({ type: 'success', title: 'Member Removed', message: 'Member was successfully removed from the group.' });
      return { error: null };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to remove member.';
      addToast({ type: 'error', title: 'Action Failed', message: msg });
      return { error: err as Error };
    }
  };

  // CRUD: Update Member Role (Make Admin / Demote)
  const updateMemberRole = async (
    groupId: string,
    userId: string,
    newRole: 'admin' | 'member'
  ): Promise<{ error: Error | null }> => {
    // Optimistic UI update
    setGroupMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
    );

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({
        type: 'success',
        title: 'Role Updated',
        message: newRole === 'admin' ? 'Member promoted to Admin.' : 'Member role updated to Member.',
      });
      return { error: null };
    }

    try {
      // 1. Attempt update_group_member_role RPC
      const { error } = await supabase.rpc('update_group_member_role', {
        p_group_id: groupId,
        p_target_user_id: userId,
        p_new_role: newRole,
      });

      if (error) {
        // Fallback direct update
        const { error: fallbackErr } = await supabase
          .from('group_members')
          .update({ role: newRole })
          .eq('group_id', groupId)
          .eq('user_id', userId);
        if (fallbackErr) throw fallbackErr;
      }

      await refreshGroupData();
      addToast({
        type: 'success',
        title: 'Role Updated',
        message: newRole === 'admin' ? 'Member promoted to Admin.' : 'Member role updated to Member.',
      });
      return { error: null };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to update member role.';
      addToast({ type: 'error', title: 'Action Failed', message: msg });
      return { error: err as Error };
    }
  };

  // CRUD: Delete Group (Admin permanently deletes group)
  const deleteGroup = async (groupId: string): Promise<{ error: Error | null }> => {
    const updated = groups.filter((g) => g.id !== groupId);
    setGroups(updated);
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
    await deleteLocalGroup(groupId);

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({ type: 'info', title: 'Group Deleted', message: 'Group was permanently deleted.' });
      return { error: null };
    }

    try {
      // 1. Attempt delete_group_by_admin RPC
      const { error } = await supabase.rpc('delete_group_by_admin', { p_group_id: groupId });
      if (error) {
        // Fallback direct delete
        const { error: fallbackErr } = await supabase.from('groups').delete().eq('id', groupId);
        if (fallbackErr) throw fallbackErr;
      }

      await refreshGroupData();
      addToast({ type: 'info', title: 'Group Deleted', message: 'Group and all its expenses deleted successfully.' });
      return { error: null };
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to delete group.';
      addToast({ type: 'error', title: 'Delete Failed', message: msg });
      return { error: err as Error };
    }
  };

  // CRUD: Add Group Expense with Equal or Custom Splits & WhatsApp-style Sync Badge
  const addGroupExpense = async (
    expenseData: {
      title: string;
      amount: number;
      category: string;
      paid_by: string;
      split_type: SplitType;
      expense_date: string;
      notes?: string;
    },
    customAllocations?: Record<string, number>
  ): Promise<{ expense: GroupExpense | null; error: Error | null }> => {
    if (!activeGroupId) {
      return { expense: null, error: new Error('No active group selected') };
    }

    const newExpenseId = generateUUID();
    const nowStr = new Date().toISOString();
    const isOnlineSync = isOnline && isSupabaseConfigured && !isDemoMode;

    const newExpense: GroupExpense = {
      ...expenseData,
      id: newExpenseId,
      group_id: activeGroupId,
      created_at: nowStr,
      updated_at: nowStr,
      sync_status: isOnlineSync ? 'synced' : 'pending',
      payer_profile: groupMembers.find((m) => m.user_id === expenseData.paid_by)?.profile,
    };

    // Calculate splits across all members
    const memberIds = groupMembers.map((m) => m.user_id);
    const splitAllocations = computeSplitAllocations(
      expenseData.amount,
      memberIds,
      expenseData.split_type,
      customAllocations
    );

    const newSplits: GroupExpenseSplit[] = splitAllocations.map((alloc) => ({
      id: generateUUID(),
      group_expense_id: newExpenseId,
      user_id: alloc.user_id,
      owed_amount: alloc.owed_amount,
      settled: alloc.user_id === expenseData.paid_by, // Automatically settled for payer
      created_at: nowStr,
      user_profile: groupMembers.find((m) => m.user_id === alloc.user_id)?.profile,
    }));

    newExpense.splits = newSplits;

    // Optimistic UI updates
    const updatedExpenses = [newExpense, ...groupExpenses];
    const updatedSplits = [...newSplits, ...groupSplits];
    setGroupExpenses(updatedExpenses);
    setGroupSplits(updatedSplits);

    // Save to IndexedDB
    await saveLocalGroupExpense(newExpense);
    await saveLocalExpenseSplits(newSplits);

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({
        type: 'success',
        title: 'Group Expense Added',
        message: `Logged ${activeGroup?.currency || userCurrency}${Number(expenseData.amount).toFixed(2)} under ${expenseData.title}.`,
      });
      return { expense: newExpense, error: null };
    }

    if (!isOnline) {
      // Enqueue to offline sync queue with pending clock icon
      await enqueueSyncItem({
        id: generateUUID(),
        temp_id: newExpenseId,
        action: 'create_expense',
        entity: 'expense',
        payload: newExpense,
        status: 'pending',
        created_at: nowStr,
        retry_count: 0,
      });
      await refreshPendingCount();
      addToast({
        type: 'info',
        title: 'Expense Queued (Offline)',
        message: 'Saved locally. Will sync automatically when network is restored.',
      });
      return { expense: newExpense, error: null };
    }

    try {
      // Insert into Supabase
      const { error: expError } = await supabase.from('group_expenses').insert({
        id: newExpense.id,
        group_id: newExpense.group_id,
        paid_by: newExpense.paid_by,
        amount: newExpense.amount,
        title: newExpense.title,
        category: newExpense.category,
        split_type: newExpense.split_type,
        expense_date: newExpense.expense_date,
        notes: newExpense.notes || null,
      });

      if (expError) throw expError;

      const { error: splitError } = await supabase.from('group_expense_splits').insert(
        newSplits.map((s) => ({
          id: s.id,
          group_expense_id: s.group_expense_id,
          user_id: s.user_id,
          owed_amount: s.owed_amount,
          settled: s.settled,
        }))
      );

      if (splitError) throw splitError;

      addToast({
        type: 'success',
        title: 'Group Expense Saved',
        message: `Logged ${activeGroup?.currency || userCurrency}${Number(expenseData.amount).toFixed(2)} split across ${memberIds.length} members.`,
      });
      return { expense: newExpense, error: null };
    } catch (err: unknown) {
      console.error('Supabase group expense save error, queued offline:', err);
      // Fallback enqueue
      await enqueueSyncItem({
        id: generateUUID(),
        temp_id: newExpenseId,
        action: 'create_expense',
        entity: 'expense',
        payload: newExpense,
        status: 'pending',
        created_at: nowStr,
        retry_count: 0,
      });
      await refreshPendingCount();
      return { expense: newExpense, error: null };
    }
  };

  // CRUD: Update Group Expense
  const updateGroupExpense = async (
    expenseId: string,
    updates: Partial<GroupExpense>
  ): Promise<{ error: Error | null }> => {
    const updatedExpenses = groupExpenses.map((exp) =>
      exp.id === expenseId ? { ...exp, ...updates, updated_at: new Date().toISOString() } : exp
    );
    setGroupExpenses(updatedExpenses);

    const target = updatedExpenses.find((e) => e.id === expenseId);
    if (target) await saveLocalGroupExpense(target);

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({ type: 'success', title: 'Expense Updated', message: 'Group expense updated.' });
      return { error: null };
    }

    if (!isOnline) {
      await enqueueSyncItem({
        id: generateUUID(),
        action: 'update_expense',
        entity: 'expense',
        payload: { id: expenseId, ...updates },
        status: 'pending',
        created_at: new Date().toISOString(),
        retry_count: 0,
      });
      await refreshPendingCount();
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('group_expenses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', expenseId);
      if (error) throw error;
      addToast({ type: 'success', title: 'Expense Updated', message: 'Details updated.' });
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  // CRUD: Delete Group Expense
  const deleteGroupExpense = async (expenseId: string): Promise<{ error: Error | null }> => {
    const updatedExpenses = groupExpenses.filter((e) => e.id !== expenseId);
    const updatedSplits = groupSplits.filter((s) => s.group_expense_id !== expenseId);
    setGroupExpenses(updatedExpenses);
    setGroupSplits(updatedSplits);

    await deleteLocalGroupExpense(expenseId);

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({ type: 'info', title: 'Expense Deleted', message: 'Group expense removed.' });
      return { error: null };
    }

    if (!isOnline) {
      await enqueueSyncItem({
        id: generateUUID(),
        action: 'delete_expense',
        entity: 'expense',
        payload: { id: expenseId },
        status: 'pending',
        created_at: new Date().toISOString(),
        retry_count: 0,
      });
      await refreshPendingCount();
      return { error: null };
    }

    try {
      const { error } = await supabase.from('group_expenses').delete().eq('id', expenseId);
      if (error) throw error;
      addToast({ type: 'info', title: 'Expense Deleted', message: 'Group expense removed.' });
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  // Settle individual split
  const settleExpenseSplit = async (splitId: string): Promise<{ error: Error | null }> => {
    const updatedSplits = groupSplits.map((s) => (s.id === splitId ? { ...s, settled: true } : s));
    setGroupSplits(updatedSplits);

    if (isDemoMode || !isSupabaseConfigured) {
      addToast({ type: 'success', title: 'Split Settled', message: 'Marked as settled.' });
      return { error: null };
    }

    if (!isOnline) {
      await enqueueSyncItem({
        id: generateUUID(),
        action: 'settle_split',
        entity: 'split',
        payload: { id: splitId },
        status: 'pending',
        created_at: new Date().toISOString(),
        retry_count: 0,
      });
      await refreshPendingCount();
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('group_expense_splits')
        .update({ settled: true })
        .eq('id', splitId);
      if (error) throw error;
      addToast({ type: 'success', title: 'Settled', message: 'Debt share marked settled.' });
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        groupMembers,
        groupExpenses,
        groupSplits,
        metrics,
        memberSummaries,
        settlements,
        isAdmin,
        isOnline,
        isSyncing,
        pendingSyncCount,
        isLoading,
        setActiveGroupId,
        createGroup,
        joinGroup,
        leaveGroup,
        removeMember,
        updateMemberRole,
        deleteGroup,
        addGroupExpense,
        updateGroupExpense,
        deleteGroupExpense,
        settleExpenseSplit,
        syncPendingQueue,
        refreshGroupData,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export function useGroups() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
}
