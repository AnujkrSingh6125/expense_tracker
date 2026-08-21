import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Group,
  GroupMember,
  GroupExpense,
  GroupExpenseSplit,
  SyncQueueItem,
} from '../types';

interface ExpenseTrackerDBSchema extends DBSchema {
  groups: {
    key: string;
    value: Group;
  };
  group_members: {
    key: string;
    value: GroupMember;
    indexes: { 'by-group': string };
  };
  group_expenses: {
    key: string;
    value: GroupExpense;
    indexes: { 'by-group': string };
  };
  group_expense_splits: {
    key: string;
    value: GroupExpenseSplit;
    indexes: { 'by-expense': string };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-status': string; 'by-created': string };
  };
}

const DB_NAME = 'expensetracker_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ExpenseTrackerDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<ExpenseTrackerDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ExpenseTrackerDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Groups store
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' });
        }

        // Group members store
        if (!db.objectStoreNames.contains('group_members')) {
          const memberStore = db.createObjectStore('group_members', { keyPath: 'id' });
          memberStore.createIndex('by-group', 'group_id');
        }

        // Group expenses store
        if (!db.objectStoreNames.contains('group_expenses')) {
          const expenseStore = db.createObjectStore('group_expenses', { keyPath: 'id' });
          expenseStore.createIndex('by-group', 'group_id');
        }

        // Group expense splits store
        if (!db.objectStoreNames.contains('group_expense_splits')) {
          const splitStore = db.createObjectStore('group_expense_splits', { keyPath: 'id' });
          splitStore.createIndex('by-expense', 'group_expense_id');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-status', 'status');
          syncStore.createIndex('by-created', 'created_at');
        }
      },
    });
  }
  return dbPromise;
}

// ==========================================
// Groups Offline Cache Helpers
// ==========================================

export async function getAllLocalGroups(): Promise<Group[]> {
  const db = await getDB();
  return db.getAll('groups');
}

export async function saveLocalGroup(group: Group): Promise<void> {
  const db = await getDB();
  await db.put('groups', group);
}

export async function saveLocalGroups(groups: Group[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('groups', 'readwrite');
  await Promise.all(groups.map((g) => tx.store.put(g)));
  await tx.done;
}

export async function deleteLocalGroup(groupId: string): Promise<void> {
  const db = await getDB();
  await db.delete('groups', groupId);
}

// ==========================================
// Group Members Offline Cache Helpers
// ==========================================

export async function getLocalGroupMembers(groupId: string): Promise<GroupMember[]> {
  const db = await getDB();
  return db.getAllFromIndex('group_members', 'by-group', groupId);
}

export async function saveLocalGroupMembers(members: GroupMember[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('group_members', 'readwrite');
  await Promise.all(members.map((m) => tx.store.put(m)));
  await tx.done;
}

// ==========================================
// Group Expenses Offline Cache Helpers
// ==========================================

export async function getLocalGroupExpenses(groupId: string): Promise<GroupExpense[]> {
  const db = await getDB();
  return db.getAllFromIndex('group_expenses', 'by-group', groupId);
}

export async function saveLocalGroupExpense(expense: GroupExpense): Promise<void> {
  const db = await getDB();
  await db.put('group_expenses', expense);
}

export async function saveLocalGroupExpenses(expenses: GroupExpense[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('group_expenses', 'readwrite');
  await Promise.all(expenses.map((e) => tx.store.put(e)));
  await tx.done;
}

export async function deleteLocalGroupExpense(expenseId: string): Promise<void> {
  const db = await getDB();
  await db.delete('group_expenses', expenseId);
}

// ==========================================
// Group Expense Splits Offline Cache Helpers
// ==========================================

export async function getLocalExpenseSplits(expenseId: string): Promise<GroupExpenseSplit[]> {
  const db = await getDB();
  return db.getAllFromIndex('group_expense_splits', 'by-expense', expenseId);
}

export async function saveLocalExpenseSplits(splits: GroupExpenseSplit[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('group_expense_splits', 'readwrite');
  await Promise.all(splits.map((s) => tx.store.put(s)));
  await tx.done;
}

// ==========================================
// Optimistic Sync Queue Helpers
// ==========================================

export async function enqueueSyncItem(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put('sync_queue', item);
}

export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const all = await db.getAll('sync_queue');
  return all
    .filter((item) => item.status === 'pending' || item.status === 'failed')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function getAllSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll('sync_queue');
}

export async function updateSyncItemStatus(
  id: string,
  status: SyncQueueItem['status'],
  errorMessage?: string
): Promise<void> {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (item) {
    item.status = status;
    if (errorMessage) item.error_message = errorMessage;
    if (status === 'failed') item.retry_count = (item.retry_count || 0) + 1;
    await db.put('sync_queue', item);
  }
}

export async function removeSyncItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function clearAllLocalData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('groups'),
    db.clear('group_members'),
    db.clear('group_expenses'),
    db.clear('group_expense_splits'),
    db.clear('sync_queue'),
  ]);
}
