import React from 'react';
import { Expense } from '../../types';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  CreditCard,
  Smartphone,
  Banknote,
  Landmark,
  Edit2,
  Trash2,
  Copy,
  Receipt,
  ArrowRight,
} from 'lucide-react';

interface RecentExpensesProps {
  onOpenAddExpense: () => void;
  onOpenEditExpense: (expense: Expense) => void;
  onViewAllExpenses: () => void;
}

export const RecentExpenses: React.FC<RecentExpensesProps> = ({
  onOpenAddExpense,
  onOpenEditExpense,
  onViewAllExpenses,
}) => {
  const { filteredExpenses, deleteExpense, addExpense } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const recentList = filteredExpenses.slice(0, 6);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5" />;
      case 'Bank Transfer':
        return <Landmark className="w-3.5 h-3.5" />;
      default:
        return <CreditCard className="w-3.5 h-3.5" />;
    }
  };

  const handleDuplicate = (expense: Expense) => {
    addExpense({
      amount: expense.amount,
      category: expense.category,
      description: `${expense.description || ''} (Copy)`.trim(),
      payment_method: expense.payment_method,
      expense_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
            Recent Transactions
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Latest entries recorded in this view
          </p>
        </div>

        {filteredExpenses.length > 6 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onViewAllExpenses}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs text-brand-600 dark:text-brand-400 font-semibold"
          >
            View All ({filteredExpenses.length})
          </Button>
        )}
      </div>

      {recentList.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 mx-auto flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
            No expenses found
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mx-auto">
            Log your daily expenses to see instant analytics and smart budget notifications.
          </p>
          <Button size="sm" onClick={onOpenAddExpense} className="text-xs mt-2">
            Record First Expense
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-surface-100 dark:divide-surface-800/80">
          {recentList.map((exp) => (
            <div
              key={exp.id}
              className="py-3.5 flex items-center justify-between gap-3 group hover:bg-surface-50/60 dark:hover:bg-surface-800/40 px-2 rounded-2xl transition-colors"
            >
              {/* Left Column: Category Badge & Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="shrink-0">
                  <Badge category={exp.category} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {exp.description || exp.category}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                    <span>{formatDate(exp.expense_date)}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      {getPaymentIcon(exp.payment_method)}
                      {exp.payment_method}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount & Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="font-extrabold text-sm sm:text-base text-surface-900 dark:text-surface-100">
                    {formatCurrency(exp.amount, currency)}
                  </span>
                </div>

                {/* Hover Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onOpenEditExpense(exp)}
                    title="Edit Expense"
                    className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(exp)}
                    title="Duplicate Expense"
                    className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    title="Delete Expense"
                    className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
