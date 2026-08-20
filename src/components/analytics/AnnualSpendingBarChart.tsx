import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Bar,
  Line,
  ComposedChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const AnnualSpendingBarChart: React.FC = () => {
  const { annualSpendingHistory, filters } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const totalYearSpend = annualSpendingHistory.reduce((sum, item) => sum + item.amount, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-surface-900/95 text-white rounded-xl shadow-xl border border-surface-700 backdrop-blur-md text-xs space-y-1">
          <p className="font-bold text-brand-400">{label} {filters.selectedYear}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="text-surface-200">
              {item.name}: <span className="font-bold text-white">{formatCurrency(item.value, currency)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              Annual Month-over-Month Trend
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Year {filters.selectedYear} aggregate spending comparison (Jan - Dec)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-surface-500">Year Total: </span>
          <span className="font-extrabold text-sm sm:text-base text-surface-900 dark:text-surface-100">
            {formatCurrency(totalYearSpend, currency)}
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={annualSpendingHistory}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="monthName"
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
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
            <Bar
              name="Spent Amount"
              dataKey="amount"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
            />
            <Line
              type="monotone"
              name="Budget Limit"
              dataKey="budgetLimit"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
