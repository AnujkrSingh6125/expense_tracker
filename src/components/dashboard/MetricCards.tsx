import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { getCategoryMeta } from '../../lib/constants';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  PieChart,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const MetricCards: React.FC = () => {
  const { metrics } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const highestMeta = metrics.highestDomain
    ? getCategoryMeta(metrics.highestDomain.category)
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Spent This Month */}
      <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
            Total Spent
          </span>
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
            {formatCurrency(metrics.totalSpentThisMonth, currency)}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {metrics.monthOverMonthChangePct !== null ? (
              metrics.monthOverMonthChangePct >= 0 ? (
                <span className="inline-flex items-center text-rose-500 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  +{metrics.monthOverMonthChangePct.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center text-emerald-500 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  {metrics.monthOverMonthChangePct.toFixed(1)}%
                </span>
              )
            ) : (
              <span className="text-surface-400">No previous month data</span>
            )}
            <span className="text-surface-400 text-[11px]">vs last month</span>
          </div>
        </div>
      </div>

      {/* 2. Remaining Monthly Budget */}
      <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
            Remaining Budget
          </span>
          <div
            className={cn(
              'p-2.5 rounded-xl',
              metrics.isOverBudget
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : metrics.isNearThreshold
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            )}
          >
            {metrics.isOverBudget ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
        </div>

        <div className="mt-4">
          <div
            className={cn(
              'text-2xl font-extrabold tracking-tight',
              metrics.isOverBudget
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-surface-900 dark:text-surface-50'
            )}
          >
            {metrics.remainingBudget !== null
              ? formatCurrency(metrics.remainingBudget, currency)
              : 'Not Configured'}
          </div>

          <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
            {metrics.monthlyBudget ? (
              <span>
                <strong>{formatCurrency(metrics.monthlyBudget, currency)}</strong> monthly limit
              </span>
            ) : (
              <span>Set budget to track savings</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Highest Expense Domain */}
      <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
            Top Domain
          </span>
          <div
            className="p-2.5 rounded-xl text-purple-600 dark:text-purple-400"
            style={{ backgroundColor: highestMeta ? `${highestMeta.color}15` : undefined, color: highestMeta ? highestMeta.color : undefined }}
          >
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight truncate">
            {metrics.highestDomain ? metrics.highestDomain.category : 'None'}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            {metrics.highestDomain ? (
              <>
                <span className="font-semibold text-surface-700 dark:text-surface-300">
                  {formatCurrency(metrics.highestDomain.amount, currency)}
                </span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {formatPercentage(metrics.highestDomain.percentage)} of total
                </span>
              </>
            ) : (
              <span>No expenses recorded</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Daily Average Spend */}
      <div className="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
            Daily Average
          </span>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
            {formatCurrency(metrics.dailyAverageSpend, currency)}
          </div>

          <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
            <span>Calculated per active day</span>
          </div>
        </div>
      </div>
    </div>
  );
};
