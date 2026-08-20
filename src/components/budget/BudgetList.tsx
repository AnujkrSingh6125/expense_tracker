import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { MONTH_NAMES } from '../../lib/constants';
import { BudgetProgressBar } from '../dashboard/BudgetProgressBar';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BudgetListProps {
  onOpenBudgetModal: () => void;
}

export const BudgetList: React.FC<BudgetListProps> = ({ onOpenBudgetModal }) => {
  const { budgets, expenses, filters, updateFilter } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  return (
    <div className="space-y-6">
      {/* Current Month Active Monitor */}
      <BudgetProgressBar onOpenBudgetModal={onOpenBudgetModal} />

      {/* Annual Months Overview Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              Year {filters.selectedYear} Budget Matrix
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Monthly limits vs actual expenditures
            </p>
          </div>

          <Button
            size="sm"
            onClick={onOpenBudgetModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Configure Limit
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {MONTH_NAMES.map((mName, idx) => {
            const mIndex = idx + 1;
            const budgetObj = budgets.find(
              (b) => b.year === filters.selectedYear && b.month === mIndex
            );

            // Compute month spend
            const monthExpenses = expenses.filter((exp) => {
              const d = new Date(exp.expense_date);
              return d.getFullYear() === filters.selectedYear && d.getMonth() + 1 === mIndex;
            });
            const spent = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
            const limit = budgetObj ? Number(budgetObj.amount_limit) : null;
            const threshold = budgetObj ? budgetObj.alert_threshold_pct : 80;
            const pct = limit && limit > 0 ? (spent / limit) * 100 : 0;
            const isOver = limit !== null && spent >= limit;
            const isNear = limit !== null && pct >= threshold;

            const isCurrentSelected = filters.selectedMonth === mIndex;

            return (
              <div
                key={mName}
                onClick={() => updateFilter('selectedMonth', mIndex)}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3',
                  isCurrentSelected
                    ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 ring-2 ring-brand-500/20 shadow-sm'
                    : 'border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 hover:border-surface-300 dark:hover:border-surface-700'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-surface-900 dark:text-surface-100">
                    {mName}
                  </span>
                  {limit !== null ? (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        isOver
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : isNear
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      )}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-surface-400">Unset</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-surface-500">Spent:</span>
                    <span className="font-bold text-surface-900 dark:text-surface-100">
                      {formatCurrency(spent, currency)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-surface-500">Limit:</span>
                    <span className="font-semibold text-surface-700 dark:text-surface-300">
                      {limit !== null ? formatCurrency(limit, currency) : '—'}
                    </span>
                  </div>
                </div>

                {limit !== null && (
                  <div className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
