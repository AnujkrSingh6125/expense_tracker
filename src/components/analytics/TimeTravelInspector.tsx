import React, { useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { MONTH_NAMES, getDomainMeta } from '../../lib/constants';
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
import {
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Layers,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const TimeTravelInspector: React.FC = () => {
  const { annualSpendingHistory, filters, updateFilter } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const availableYears = [2023, 2024, 2025, 2026, 2027, 2028];
  const today = new Date();
  const currentActualYear = today.getFullYear();
  const currentActualMonth = today.getMonth() + 1;

  const totalYearSpend = annualSpendingHistory.reduce((sum, item) => sum + item.amount, 0);

  // Jump handlers
  const handleYearChange = (year: number) => {
    updateFilter('selectedYear', year);
  };

  const handleMonthChange = (month: number) => {
    updateFilter('selectedMonth', month);
  };

  const handleJumpToCurrent = () => {
    updateFilter('selectedYear', currentActualYear);
    updateFilter('selectedMonth', currentActualMonth);
  };

  // Custom Rich Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const monthFullName = MONTH_NAMES[data.month - 1];

      return (
        <div className="p-4 bg-surface-950/95 dark:bg-surface-900/95 text-white rounded-2xl shadow-2xl border border-surface-700/80 backdrop-blur-xl text-xs space-y-2.5 min-w-[240px] animate-fade-in pointer-events-none">
          {/* Header: Month & Year */}
          <div className="flex items-center justify-between border-b border-surface-800 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-sm text-surface-100">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span>{monthFullName} {filters.selectedYear}</span>
            </div>
            {data.month === filters.selectedMonth && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">
                Active View
              </span>
            )}
          </div>

          {/* Main Total & MoM */}
          <div className="flex items-baseline justify-between gap-2 pt-0.5">
            <span className="text-surface-400 text-xs font-medium">Monthly Total:</span>
            <span className="text-base font-extrabold text-white">
              {formatCurrency(data.amount, currency)}
            </span>
          </div>

          {/* MoM % Change */}
          {data.momChangePct !== null && data.momChangePct !== undefined && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-surface-400">vs Prior Month:</span>
              <span
                className={cn(
                  'font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-md',
                  data.momChangePct > 0
                    ? 'text-rose-400 bg-rose-950/40'
                    : 'text-emerald-400 bg-emerald-950/40'
                )}
              >
                {data.momChangePct > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {data.momChangePct > 0 ? `+${data.momChangePct.toFixed(1)}%` : `${data.momChangePct.toFixed(1)}%`}
              </span>
            </div>
          )}

          {/* Top Category */}
          {data.topCategory && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-surface-400">Top Category:</span>
              <span className="font-semibold text-brand-300 bg-brand-950/50 px-2 py-0.5 rounded-md border border-brand-800/40">
                {data.topCategory}
              </span>
            </div>
          )}

          {/* Custom Domain Breakdown */}
          {data.domainBreakdown && Object.keys(data.domainBreakdown).length > 0 && (
            <div className="pt-2 border-t border-surface-800/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Domain Breakdown</span>
              </span>
              <div className="space-y-1 pt-1 max-h-28 overflow-y-auto">
                {Object.entries(data.domainBreakdown).map(([domain, amt]) => {
                  const meta = getDomainMeta(domain);
                  return (
                    <div key={domain} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="text-surface-300 font-medium">{domain}</span>
                      </div>
                      <span className="font-bold text-surface-100">
                        {formatCurrency(Number(amt), currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer prompt */}
          <div className="pt-2 border-t border-surface-800/60 text-[10px] text-surface-400 flex items-center justify-between">
            <span>{data.count || 0} transaction{data.count === 1 ? '' : 's'}</span>
            <span className="text-brand-400 font-semibold">Click to Travel ↵</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* 1. Time-Travel Scrubber & Timeline Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-4 transition-all">
        {/* Top Header: Title + Year Picker + Jump to Today */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-surface-900 dark:text-surface-100">
                  Time-Travel Inspector
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  Telemetry
                </span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Scrub historical timelines, hover to inspect domains, or click a month to time-travel
              </p>
            </div>
          </div>

          {/* Year Buttons & Today Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Year Selector Pills */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700/60">
              {availableYears.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleYearChange(year)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    filters.selectedYear === year
                      ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-200'
                  )}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Jump to Present Day */}
            <button
              type="button"
              onClick={handleJumpToCurrent}
              title="Jump to current real-time month and year"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800/40 transition-colors whitespace-nowrap active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
          </div>
        </div>

        {/* Month Scrubbing Rail (Jan - Dec) */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
          {annualSpendingHistory.map((item) => {
            const isSelected = filters.selectedMonth === item.month;
            const isCurrentMonth =
              filters.selectedYear === currentActualYear && item.month === currentActualMonth;
            const hasSpend = item.amount > 0;

            return (
              <button
                key={item.month}
                type="button"
                onClick={() => handleMonthChange(item.month)}
                onMouseEnter={() => setHoveredMonth(item.month)}
                onMouseLeave={() => setHoveredMonth(null)}
                className={cn(
                  'p-2 sm:p-2.5 rounded-2xl text-center border transition-all relative flex flex-col items-center justify-between min-h-[58px]',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500/30 text-brand-700 dark:text-brand-300 font-extrabold shadow-sm'
                    : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800/50 hover:border-brand-300 dark:hover:border-brand-700/60 text-surface-600 dark:text-surface-400'
                )}
              >
                {/* Month Name */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold tracking-tight">{item.monthName}</span>
                  {isCurrentMonth && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>

                {/* Mini Spend indicator */}
                <span
                  className={cn(
                    'text-[10px] font-mono font-semibold truncate max-w-full',
                    hasSpend
                      ? isSelected
                        ? 'text-brand-600 dark:text-brand-400 font-bold'
                        : 'text-surface-700 dark:text-surface-300'
                      : 'text-surface-400/60'
                  )}
                >
                  {hasSpend ? formatCurrency(item.amount, currency) : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Annual Spending Trajectory & Hover Inspector Chart */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-3 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-surface-900 dark:text-surface-100">
                {filters.selectedYear} Monthly Trajectory & Hover Telemetry
              </h4>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Click any bar to lock the dashboard view to that specific month
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-surface-500">Year {filters.selectedYear} Total: </span>
            <span className="font-extrabold text-sm sm:text-base text-surface-900 dark:text-surface-100">
              {formatCurrency(totalYearSpend, currency)}
            </span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={annualSpendingHistory}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length) {
                  const clickedMonth = e.activePayload[0].payload.month;
                  handleMonthChange(clickedMonth);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
              <XAxis
                dataKey="monthName"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `${currency}${v}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} cursor="pointer">
                {annualSpendingHistory.map((entry) => {
                  const isSelected = entry.month === filters.selectedMonth;
                  const isHovered = entry.month === hoveredMonth;

                  return (
                    <Cell
                      key={`month-cell-${entry.month}`}
                      fill={
                        isSelected
                          ? '#6366f1'
                          : isHovered
                          ? '#818cf8'
                          : entry.amount > 0
                          ? '#a5b4fc'
                          : '#e2e8f0'
                      }
                      className="transition-colors duration-200"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Status Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-surface-500 pt-2 border-t border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
              <span>Active Month ({MONTH_NAMES[filters.selectedMonth - 1]})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-300 dark:bg-indigo-400 inline-block" />
              <span>Recorded Spending</span>
            </div>
          </div>

          <div className="text-[11px] text-surface-400 font-medium">
            Active Filter: <span className="font-bold text-surface-700 dark:text-surface-300">{MONTH_NAMES[filters.selectedMonth - 1]} {filters.selectedYear}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
