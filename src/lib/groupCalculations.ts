import {
  GroupExpense,
  GroupExpenseSplit,
  GroupMember,
  GroupMemberSummary,
  GroupMetricSummary,
  GroupSettlement,
  SplitType,
} from '../types';

/**
 * Calculates overall metrics for the group and the current active user
 */
export function calculateGroupMetrics(
  expenses: GroupExpense[],
  splits: GroupExpenseSplit[],
  members: GroupMember[],
  currentUserId: string
): GroupMetricSummary {
  const total_group_spend = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Total amount paid out-of-pocket by the current user
  const user_total_paid = expenses
    .filter((exp) => exp.paid_by === currentUserId)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Total fair share owed by the current user across all expenses
  const user_total_owed = splits
    .filter((s) => s.user_id === currentUserId)
    .reduce((sum, s) => sum + Number(s.owed_amount), 0);

  // Net Balance: If positive, user is owed money by the group. If negative, user owes the group.
  const user_net_balance = user_total_paid - user_total_owed;

  return {
    total_group_spend,
    user_total_paid,
    user_total_owed,
    user_net_balance,
    expense_count: expenses.length,
    member_count: members.length,
  };
}

/**
 * Calculates spending breakdown and net balance for each individual member
 */
export function calculateMemberSummaries(
  expenses: GroupExpense[],
  splits: GroupExpenseSplit[],
  members: GroupMember[]
): GroupMemberSummary[] {
  const totalGroupSpend = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return members.map((member) => {
    const total_paid = expenses
      .filter((exp) => exp.paid_by === member.user_id)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);

    const total_owed = splits
      .filter((s) => s.user_id === member.user_id)
      .reduce((sum, s) => sum + Number(s.owed_amount), 0);

    const net_balance = total_paid - total_owed;
    const percentage_of_total = totalGroupSpend > 0 ? (total_paid / totalGroupSpend) * 100 : 0;

    const name = member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Member';
    const email = member.profile?.email || '';

    return {
      user_id: member.user_id,
      name,
      email,
      role: member.role,
      total_paid,
      total_owed,
      net_balance,
      percentage_of_total,
    };
  }).sort((a, b) => b.total_paid - a.total_paid);
}

/**
 * Computes simplified pairwise debt settlements using a greedy balance clearing algorithm
 */
export function calculatePairwiseSettlements(
  expenses: GroupExpense[],
  splits: GroupExpenseSplit[],
  members: GroupMember[]
): GroupSettlement[] {
  const memberSummaries = calculateMemberSummaries(expenses, splits, members);

  // Debtors: net_balance < -0.01 (they owe money)
  // Creditors: net_balance > 0.01 (they are owed money)
  const debtors: { user_id: string; name: string; amount: number }[] = [];
  const creditors: { user_id: string; name: string; amount: number }[] = [];

  memberSummaries.forEach((m) => {
    if (m.net_balance < -0.01) {
      debtors.push({ user_id: m.user_id, name: m.name, amount: Math.abs(m.net_balance) });
    } else if (m.net_balance > 0.01) {
      creditors.push({ user_id: m.user_id, name: m.name, amount: m.net_balance });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: GroupSettlement[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0.01) {
      settlements.push({
        from_user_id: debtor.user_id,
        from_user_name: debtor.name,
        to_user_id: creditor.user_id,
        to_user_name: creditor.name,
        amount: Math.round(settledAmount * 100) / 100,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.01) dIdx++;
    if (creditor.amount < 0.01) cIdx++;
  }

  return settlements;
}

/**
 * Splits an amount across members based on splitType
 */
export function computeSplitAllocations(
  totalAmount: number,
  memberIds: string[],
  splitType: SplitType,
  customAllocations?: Record<string, number>
): { user_id: string; owed_amount: number }[] {
  if (memberIds.length === 0 || totalAmount <= 0) return [];

  if (splitType === 'equal') {
    const baseShare = Math.floor((totalAmount / memberIds.length) * 100) / 100;
    let remainder = Math.round((totalAmount - baseShare * memberIds.length) * 100) / 100;

    return memberIds.map((userId) => {
      let owed = baseShare;
      if (remainder > 0.001) {
        owed += 0.01;
        remainder = Math.round((remainder - 0.01) * 100) / 100;
      }
      return {
        user_id: userId,
        owed_amount: Math.round(owed * 100) / 100,
      };
    });
  }

  if (splitType === 'custom' && customAllocations) {
    return memberIds.map((userId) => ({
      user_id: userId,
      owed_amount: Number(customAllocations[userId] || 0),
    }));
  }

  return memberIds.map((userId) => ({
    user_id: userId,
    owed_amount: 0,
  }));
}
