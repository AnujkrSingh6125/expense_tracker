import React from 'react';
import { Expense } from '../../types';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getDomainMeta } from '../../lib/constants';
import { exportExpensesToCSV } from '../../lib/exportUtils';
import { ExpenseFilterBar } from './ExpenseFilterBar';
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
  Download,
  Plus,
} from 'lucide-react';

interface ExpenseListProps {
  onOpenAddExpense: () => void;
  onOpenEditExpense: (expense: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  onOpenAddExpense,
  onOpenEditExpense,
}) => {
  const { filteredExpenses, deleteExpense, addExpense, isLoading } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const handleDuplicate = (expense: Expense) => {
    addExpense({
      amount: expense.amount,
      category: expense.category,
      domain: expense.domain || 'Personal',
      description: expense.description ? `${expense.description} (Copy)` : null,
      payment_method: expense.payment_method,
      expense_date: new Date().toISOString().split('T')[0],
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Card':
        return <CreditCard className="w-3.5 h-3.5" />;
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

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <ExpenseFilterBar />

      {/* Transactions List / Table */}
      <div className="rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden transition-all">
        {/* Table Header Controls */}
        <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              Transactions Record
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
              {filteredExpenses.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            {filteredExpenses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportExpensesToCSV(filteredExpenses, currency)}
                leftIcon={<Download className="w-4 h-4" />}
                className="text-xs"
              >
                Export CSV
              </Button>
            )}
            <Button
              size="sm"
              onClick={onOpenAddExpense}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs bg-brand-600 hover:bg-brand-700"
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 text-center text-surface-400 text-sm">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading transaction ledger...
          </div>
        ) : filteredExpenses.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-surface-800 dark:text-surface-200">
                No Transactions Found
              </p>
              <p className="text-xs text-surface-500 mt-0.5">
                No expense entries match your current search, domain, or filter criteria.
              </p>
            </div>
            <Button size="sm" onClick={onOpenAddExpense} leftIcon={<Plus className="w-4 h-4" />}>
              Record First Expense
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800 text-[11px] font-bold uppercase tracking-wider text-surface-400 bg-surface-50/50 dark:bg-surface-900/50">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category & Domain</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-surface-50/60 dark:hover:bg-surface-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-xs font-semibold text-surface-600 dark:text-surface-400 whitespace-nowrap">
                        {formatDate(exp.expense_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge category={exp.category} />
                          {exp.domain && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                              style={{
                                borderColor: `${getDomainMeta(exp.domain).color}40`,
                                backgroundColor: `${getDomainMeta(exp.domain).color}15`,
                                color: getDomainMeta(exp.domain).color,
                              }}
                            >
                              {exp.domain}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-surface-900 dark:text-surface-100 max-w-xs truncate">
                        {exp.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-lg">
                          {getPaymentIcon(exp.payment_method)}
                          {exp.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-surface-900 dark:text-surface-100 whitespace-nowrap">
                        {formatCurrency(exp.amount, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onOpenEditExpense(exp)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(exp)}
                            title="Duplicate"
                            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-surface-100 dark:divide-surface-800">
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="p-4 space-y-2.5 hover:bg-surface-50/50 dark:hover:bg-surface-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge category={exp.category} />
                      {exp.domain && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                          style={{
                            borderColor: `${getDomainMeta(exp.domain).color}40`,
                            backgroundColor: `${getDomainMeta(exp.domain).color}15`,
                            color: getDomainMeta(exp.domain).color,
                          }}
                        >
                          {exp.domain}
                        </span>
                      )}
                    </div>
                    <span className="font-extrabold text-base text-surface-900 dark:text-surface-100">
                      {formatCurrency(exp.amount, currency)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                    {exp.description || exp.category}
                  </p>

                  <div className="flex items-center justify-between text-xs text-surface-500 pt-1">
                    <div className="flex items-center gap-2">
                      <span>{formatDate(exp.expense_date)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        {getPaymentIcon(exp.payment_method)}
                        {exp.payment_method}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenEditExpense(exp)}
                        title="Edit expense"
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-brand-600 dark:hover:text-brand-400 active:scale-95 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(exp)}
                        title="Duplicate expense"
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 active:scale-95 transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExpense(exp.id)}
                        title="Delete expense"
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-rose-600 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
