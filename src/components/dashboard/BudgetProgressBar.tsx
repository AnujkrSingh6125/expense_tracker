import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercentage, clamp } from '../../lib/utils';
import { MONTH_NAMES } from '../../lib/constants';
import { Button } from '../ui/Button';
import { Target, AlertTriangle, CheckCircle, AlertOctagon, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BudgetProgressBarProps {
  onOpenBudgetModal: () => void;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ onOpenBudgetModal }) => {
  const { metrics, currentMonthBudget, filters } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const monthName = MONTH_NAMES[filters.selectedMonth - 1];
  const budgetLimit = metrics.monthlyBudget;
  const percentage = metrics.budgetPercentage;
  const thresholdPct = currentMonthBudget?.alert_threshold_pct || 80;

  // Determine status color and message
  let barColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let statusIcon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
  let statusText = 'Spending is on track';

  if (metrics.isOverBudget) {
    barColor = 'bg-rose-500';
    badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    statusIcon = <AlertOctagon className="w-4 h-4 text-rose-500" />;
    statusText = 'Budget Limit Exceeded!';
  } else if (metrics.isNearThreshold) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    statusIcon = <AlertTriangle className="w-4 h-4 text-amber-500" />;
    statusText = `Warning: Crossed ${thresholdPct}% Threshold`;
  }

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              {monthName} {filters.selectedYear} Budget Limit & Alert Monitor
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Live automated threshold alerts and progress tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {budgetLimit !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                badgeColor
              )}
            >
              {statusIcon}
              {statusText}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenBudgetModal}
            leftIcon={<Settings className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {budgetLimit !== null ? 'Configure Budget' : 'Set Monthly Budget'}
          </Button>
        </div>
      </div>

      {budgetLimit !== null ? (
        <div className="space-y-3">
          {/* Numbers line */}
          <div className="flex items-end justify-between text-xs sm:text-sm">
            <div>
              <span className="text-surface-500 dark:text-surface-400">Spent: </span>
              <span className="font-bold text-surface-900 dark:text-surface-100">
                {formatCurrency(metrics.totalSpentThisMonth, currency)}
              </span>
              <span className="text-surface-400"> of </span>
              <span className="font-bold text-surface-900 dark:text-surface-100">
                {formatCurrency(budgetLimit, currency)}
              </span>
            </div>

            <div className="font-extrabold text-sm sm:text-base">
              <span className={cn(metrics.isOverBudget ? 'text-rose-500' : metrics.isNearThreshold ? 'text-amber-500' : 'text-emerald-500')}>
                {formatPercentage(percentage)}
              </span>
            </div>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="relative w-full h-4 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden p-0.5 border border-surface-200 dark:border-surface-700">
            {/* Threshold indicator line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-surface-400 dark:bg-surface-500 z-10 opacity-70"
              style={{ left: `${thresholdPct}%` }}
              title={`Alert threshold at ${thresholdPct}%`}
            />

            {/* Filled bar */}
            <div
              className={cn('h-full rounded-full transition-all duration-700', barColor)}
              style={{ width: `${clamp(percentage, 0, 100)}%` }}
            />
          </div>

          {/* Bottom legend */}
          <div className="flex items-center justify-between text-[11px] text-surface-400 pt-1">
            <span>0%</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Alert Threshold: {thresholdPct}% ({formatCurrency((budgetLimit * thresholdPct) / 100, currency)})
            </span>
            <span>100% ({formatCurrency(budgetLimit, currency)})</span>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-dashed border-surface-200 dark:border-surface-700 text-center space-y-2">
          <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
            No budget limit established for {monthName} {filters.selectedYear}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 max-w-md mx-auto">
            Set an overall monthly spending ceiling to unlock automatic smart threshold warnings and remaining budget analytics.
          </p>
          <Button size="sm" onClick={onOpenBudgetModal} className="mt-2 text-xs">
            Establish {monthName} Budget
          </Button>
        </div>
      )}
    </div>
  );
};
