import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, SlidersHorizontal } from 'lucide-react';

export const DomainComparisonChart: React.FC = () => {
  const { categorySummaries } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const [chartType, setChartType] = useState<'doughnut' | 'horizontal' | 'vertical'>('doughnut');

  if (categorySummaries.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm text-center py-16">
        <PieIcon className="w-10 h-10 text-surface-400 mx-auto mb-2" />
        <p className="font-semibold text-surface-700 dark:text-surface-300">No domain spending data</p>
        <p className="text-xs text-surface-500 mt-1">Add expenses to visualize category comparison charts.</p>
      </div>
    );
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-surface-900/95 text-white rounded-xl shadow-xl border border-surface-700 backdrop-blur-md text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.category}</span>
          </div>
          <p className="text-surface-300">
            Amount: <span className="font-semibold text-white">{formatCurrency(data.amount, currency)}</span>
          </p>
          <p className="text-surface-300">
            Share: <span className="font-semibold text-brand-400">{formatPercentage(data.percentage)}</span>
          </p>
          <p className="text-surface-400 text-[10px]">{data.count} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between transition-all">
      {/* Header & Chart Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-bold text-base text-surface-900 dark:text-surface-100 flex items-center gap-2">
            Domain Spending Breakdown
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Side-by-side domain distribution and percentage contribution
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-surface-100 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700/60 self-start sm:self-auto">
          <button
            onClick={() => setChartType('doughnut')}
            title="Doughnut Chart"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chartType === 'doughnut'
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Doughnut</span>
          </button>
          <button
            onClick={() => setChartType('horizontal')}
            title="Horizontal Bar Chart"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chartType === 'horizontal'
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Horizontal</span>
          </button>
          <button
            onClick={() => setChartType('vertical')}
            title="Vertical Bar Chart"
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chartType === 'vertical'
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Vertical</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'doughnut' ? (
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={categorySummaries}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
              >
                {categorySummaries.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Legend
                formatter={(value: string) => {
                  const item = categorySummaries.find((c) => c.category === value);
                  return (
                    <span className="text-xs text-surface-700 dark:text-surface-300 font-medium">
                      {value} {item ? `(${formatPercentage(item.percentage)})` : ''}
                    </span>
                  );
                }}
              />
            </PieChart>
          ) : chartType === 'horizontal' ? (
            <BarChart
              data={categorySummaries}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => `${currency}${v}`}
                stroke="#94a3b8"
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                {categorySummaries.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={categorySummaries}
              margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
            >
              <XAxis
                dataKey="category"
                stroke="#94a3b8"
                fontSize={11}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tickFormatter={(v) => `${currency}${v}`}
                stroke="#94a3b8"
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {categorySummaries.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Quick Summary Badges */}
      <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {categorySummaries.slice(0, 4).map((cat) => (
          <div
            key={cat.category}
            className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/60 dark:border-surface-700/40 flex flex-col"
          >
            <div className="flex items-center gap-1.5 text-xs text-surface-500 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="truncate">{cat.category}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-bold text-xs text-surface-900 dark:text-surface-100">
                {formatCurrency(cat.amount, currency)}
              </span>
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                {formatPercentage(cat.percentage)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
