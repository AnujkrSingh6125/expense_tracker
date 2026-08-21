import React, { useState } from 'react';
import { useGroups } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GroupExpense } from '../../types';
import {
  ArrowLeft,
  Users,
  Plus,
  Copy,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Edit2,
  DollarSign,
  Scale,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

interface GroupDashboardViewProps {
  onBack: () => void;
  onOpenAddExpense: () => void;
  onOpenEditExpense: (expense: GroupExpense) => void;
  onOpenMembersModal: () => void;
}

export const GroupDashboardView: React.FC<GroupDashboardViewProps> = ({
  onBack,
  onOpenAddExpense,
  onOpenEditExpense,
  onOpenMembersModal,
}) => {
  const {
    activeGroup,
    groupMembers,
    groupExpenses,
    metrics,
    memberSummaries,
    settlements,
    isAdmin,
    deleteGroupExpense,
  } = useGroups();
  const { user } = useAuth();
  const { addToast } = useExpenses();

  const [copiedCode, setCopiedCode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!activeGroup) return null;

  const currentUserId = user?.id || 'demo-user-12345';
  const currencySymbol = activeGroup.currency || '₹';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeGroup.join_code);
    setCopiedCode(true);
    addToast({
      type: 'success',
      title: 'Invite Code Copied',
      message: `Join code "${activeGroup.join_code}" copied to clipboard!`,
    });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this group expense?')) {
      setDeletingId(expenseId);
      await deleteGroupExpense(expenseId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
                {activeGroup.name}
              </h1>
              {isAdmin && (
                <Badge variant="info" className="text-[10px] py-0.5 px-2">
                  Admin
                </Badge>
              )}
              <button
                type="button"
                onClick={handleCopyCode}
                title="Click to copy join code"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-mono font-bold hover:bg-brand-100 transition-colors shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{activeGroup.join_code}</span>
              </button>
            </div>
            {activeGroup.description && (
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{activeGroup.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenMembersModal}
            className="border-surface-300 dark:border-surface-700 font-bold"
          >
            <Users className="w-4 h-4 mr-1.5" />
            <span>{groupMembers.length} Members</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onOpenAddExpense}
            className="bg-brand-600 hover:bg-brand-700 text-white shadow-md font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Log Expense</span>
          </Button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Group Spend */}
        <div className="p-5 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-surface-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Group Spend</span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-surface-900 dark:text-surface-100">
              {currencySymbol}
              {metrics.total_group_spend.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-[11px] text-surface-400 mt-0.5">
              Across {metrics.expense_count} recorded transaction{metrics.expense_count === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Metric 2: Your Total Paid Out-of-Pocket */}
        <div className="p-5 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-surface-500 text-xs font-bold uppercase tracking-wider">
            <span>Your Out-of-Pocket</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-surface-900 dark:text-surface-100">
              {currencySymbol}
              {metrics.user_total_paid.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-[11px] text-surface-400 mt-0.5">
              Your fair share: {currencySymbol}
              {metrics.user_total_owed.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Metric 3: Net Settlement Balance */}
        <div
          className={`p-5 rounded-3xl border shadow-sm space-y-2 ${
            metrics.user_net_balance > 0.01
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
              : metrics.user_net_balance < -0.01
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
              : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span
              className={
                metrics.user_net_balance > 0.01
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : metrics.user_net_balance < -0.01
                  ? 'text-rose-800 dark:text-rose-300'
                  : 'text-surface-500'
              }
            >
              Net Settlement
            </span>
            <div
              className={`p-2 rounded-xl ${
                metrics.user_net_balance > 0.01
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700'
                  : metrics.user_net_balance < -0.01
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-black ${
                metrics.user_net_balance > 0.01
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : metrics.user_net_balance < -0.01
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-surface-900 dark:text-surface-100'
              }`}
            >
              {metrics.user_net_balance > 0.01
                ? `+${currencySymbol}${metrics.user_net_balance.toFixed(2)}`
                : metrics.user_net_balance < -0.01
                ? `-${currencySymbol}${Math.abs(metrics.user_net_balance).toFixed(2)}`
                : 'All Settled Up'}
            </div>
            <p className="text-[11px] font-semibold text-surface-500 dark:text-surface-400 mt-0.5">
              {metrics.user_net_balance > 0.01
                ? 'You are owed by other members'
                : metrics.user_net_balance < -0.01
                ? 'You owe the group'
                : 'You are completely even'}
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Member Breakdown & Debt Resolution Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pairwise Debt Settlements */}
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Suggested Settlement Matrix</span>
            </h3>
            <span className="text-[11px] text-surface-400 font-medium">Simplified debt clearing</span>
          </div>

          {settlements.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface-50 dark:bg-surface-800/50 space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-surface-800 dark:text-surface-200">
                All Balances Cleared
              </p>
              <p className="text-[11px] text-surface-400">
                There are no pending debts between group members right now.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {settlements.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-surface-900 dark:text-surface-100 truncate">
                      {s.from_user_id === currentUserId ? 'You' : s.from_user_name}
                    </span>
                    <span className="text-surface-400 font-medium shrink-0">owes</span>
                    <span className="font-bold text-surface-900 dark:text-surface-100 truncate">
                      {s.to_user_id === currentUserId ? 'You' : s.to_user_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold font-mono text-sm text-brand-600 dark:text-brand-400">
                      {currencySymbol}
                      {s.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Spending Progress vs Total */}
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Member Contribution Breakdown</span>
            </h3>
            <span className="text-[11px] text-surface-400 font-medium">
              {groupMembers.length} participant{groupMembers.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-3.5">
            {memberSummaries.map((m) => (
              <div key={m.user_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-surface-900 dark:text-surface-100">
                      {m.user_id === currentUserId ? `${m.name} (You)` : m.name}
                    </span>
                    {m.role === 'admin' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="font-bold font-mono text-surface-900 dark:text-surface-100">
                    {currencySymbol}
                    {m.total_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (
                    {m.percentage_of_total.toFixed(0)}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.min(m.percentage_of_total, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History & Group Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-surface-900 dark:text-surface-100">
              Group Transaction Ledger ({groupExpenses.length})
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Real-time multi-user expense feed with optimistic sync status
            </p>
          </div>

          <Button type="button" size="sm" onClick={onOpenAddExpense} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Expense</span>
          </Button>
        </div>

        {groupExpenses.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-surface-900 dark:text-surface-100">
                No Expenses Recorded Yet
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Click "Log Expense" above to add shared resort stays, dining, bills, or groceries.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {groupExpenses.map((expense) => {
              const isPayer = expense.paid_by === currentUserId;
              const payerName =
                expense.payer_profile?.full_name ||
                groupMembers.find((m) => m.user_id === expense.paid_by)?.profile?.full_name ||
                (isPayer ? 'You' : 'Member');

              return (
                <div
                  key={expense.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-base shrink-0 border border-brand-200 dark:border-brand-800">
                      {expense.category.charAt(0)}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm sm:text-base text-surface-900 dark:text-surface-100">
                          {expense.title}
                        </h4>
                        <Badge variant="default" className="text-[10px] py-0 px-1.5">
                          {expense.category}
                        </Badge>
                        <Badge variant="info" className="text-[10px] py-0 px-1.5 uppercase">
                          {expense.split_type} Split
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                        <span>
                          Paid by <strong>{isPayer ? 'You' : payerName}</strong>
                        </span>
                        <span>•</span>
                        <span>{expense.expense_date}</span>
                        {expense.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-xs">{expense.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount + WhatsApp-style Sync Badge + Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-surface-100 dark:border-surface-800">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-black text-surface-900 dark:text-surface-100">
                        {currencySymbol}
                        {Number(expense.amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>

                      {/* WhatsApp-style sync status indicator */}
                      <div className="flex items-center gap-1 text-[11px] font-semibold">
                        {expense.sync_status === 'pending' ? (
                          <span
                            title="Pending sync (Stored offline)"
                            className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Queued Offline</span>
                          </span>
                        ) : (
                          <span
                            title="Synced to cloud"
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Synced</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditExpense(expense)}
                        title="Edit expense"
                        className="p-2 rounded-xl text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        title="Delete expense"
                        className="p-2 rounded-xl text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
