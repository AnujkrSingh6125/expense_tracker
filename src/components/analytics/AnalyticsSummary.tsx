import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { getCategoryMeta } from '../../lib/constants';
import { Badge } from '../ui/Badge';
import { Layers } from 'lucide-react';

export const AnalyticsSummary: React.FC = () => {
  const { categorySummaries } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
            Domain Ranking & Insights
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Comprehensive breakdown sorted by highest spending impact
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {categorySummaries.map((cat, index) => {
          const meta = getCategoryMeta(cat.category);
          const avgPerTxn = cat.count > 0 ? cat.amount / cat.count : 0;

          return (
            <div
              key={cat.category}
              className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-500/30 transition-all"
            >
              {/* Category info & bar */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-bold text-xs flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <Badge category={cat.category} />
                  <span className="text-xs text-surface-400">
                    {cat.count} {cat.count === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>

                {/* Progress share bar */}
                <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%`, backgroundColor: meta.color }}
                  />
                </div>
              </div>

              {/* Amount and percentage stats */}
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right shrink-0">
                <div>
                  <p className="text-[11px] text-surface-400">Avg / Txn</p>
                  <p className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                    {formatCurrency(avgPerTxn, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-surface-400">Total Spent</p>
                  <p className="text-sm sm:text-base font-extrabold text-surface-900 dark:text-surface-100">
                    {formatCurrency(cat.amount, currency)}
                  </p>
                </div>
                <div className="w-12 text-right">
                  <p className="text-[11px] text-surface-400">Share</p>
                  <p className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
                    {formatPercentage(cat.percentage)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
