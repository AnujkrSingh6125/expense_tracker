import React from 'react';
import { Expense } from '../../types';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
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
  const { filteredExpenses, deleteExpense, addExpense } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const totalFilteredAmount = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

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

  const handleExport = () => {
    exportExpensesToCSV(filteredExpenses, currency, 'filtered-expenses.csv');
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <ExpenseFilterBar />

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
            Recorded Transactions
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
            {filteredExpenses.length} entries
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-surface-500 dark:text-surface-400">
            Filtered Total:{' '}
            <span className="font-extrabold text-sm text-surface-900 dark:text-surface-100">
              {formatCurrency(totalFilteredAmount, currency)}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            CSV
          </Button>
        </div>
      </div>

      {/* Expenses Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden transition-all">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 mx-auto flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
              No matching expenses found
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 max-w-sm mx-auto">
              Try adjusting your search query, changing category filters, or select a different date range.
            </p>
            <Button size="sm" onClick={onOpenAddExpense} className="text-xs mt-2" leftIcon={<Plus className="w-4 h-4" />}>
              Add Expense
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-surface-50/75 dark:bg-surface-800/60 border-b border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Domain / Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Method</th>
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
                      <td className="py-3.5 px-4 font-mono text-xs text-surface-600 dark:text-surface-300 whitespace-nowrap">
                        {formatDate(exp.expense_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge category={exp.category} />
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
                <div key={exp.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge category={exp.category} />
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenEditExpense(exp)}
                        className="p-1 text-surface-400 hover:text-brand-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(exp)}
                        className="p-1 text-surface-400 hover:text-surface-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1 text-surface-400 hover:text-rose-600"
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
