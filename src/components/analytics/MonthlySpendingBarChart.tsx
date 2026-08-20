import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { MONTH_NAMES } from '../../lib/constants';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Calendar } from 'lucide-react';

export const MonthlySpendingBarChart: React.FC = () => {
  const { dailySpending, filters } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const monthName = MONTH_NAMES[filters.selectedMonth - 1];

  // Find max daily amount for highlight
  const maxDayAmount = Math.max(...dailySpending.map((d) => d.amount), 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-surface-900/95 text-white rounded-xl shadow-xl border border-surface-700 backdrop-blur-md text-xs space-y-1">
          <p className="font-bold text-brand-400">{data.dateStr}, {filters.selectedYear}</p>
          <p className="text-surface-200">
            Total Spent: <span className="font-bold text-white">{formatCurrency(data.amount, currency)}</span>
          </p>
          <p className="text-surface-400 text-[10px]">{data.count} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              Daily Spending Breakdown
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Expense distribution across each day of {monthName} {filters.selectedYear}
            </p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailySpending} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="day"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => `${currency}${v}`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {dailySpending.map((entry, index) => {
                const isMax = maxDayAmount > 0 && entry.amount === maxDayAmount;
                return (
                  <Cell
                    key={`daily-cell-${index}`}
                    fill={isMax ? '#6366f1' : entry.amount > 0 ? '#818cf8' : '#e2e8f0'}
                    opacity={entry.amount > 0 ? 1 : 0.4}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-surface-500 border-t border-surface-100 dark:border-surface-800 pt-3">
        <span>Day 1 ({monthName})</span>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded bg-brand-500" />
          <span>Peak spending day</span>
        </div>
        <span>Day {dailySpending.length} ({monthName})</span>
      </div>
    </div>
  );
};
