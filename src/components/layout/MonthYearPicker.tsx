import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { MONTH_NAMES } from '../../lib/constants';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const MonthYearPicker: React.FC = () => {
  const { filters, updateFilter } = useExpenses();

  const handlePrevMonth = () => {
    if (filters.selectedMonth === 1) {
      updateFilter('selectedMonth', 12);
      updateFilter('selectedYear', filters.selectedYear - 1);
    } else {
      updateFilter('selectedMonth', filters.selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (filters.selectedMonth === 12) {
      updateFilter('selectedMonth', 1);
      updateFilter('selectedYear', filters.selectedYear + 1);
    } else {
      updateFilter('selectedMonth', filters.selectedMonth + 1);
    }
  };

  const yearOptions = [2023, 2024, 2025, 2026, 2027, 2028];

  return (
    <div className="inline-flex items-center gap-1 bg-surface-100 dark:bg-surface-800/80 p-1 rounded-xl border border-surface-200 dark:border-surface-700/70 shadow-sm">
      <button
        onClick={handlePrevMonth}
        title="Previous Month"
        className="p-1.5 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Month Dropdown */}
      <div className="flex items-center gap-1.5 px-2 font-medium text-xs sm:text-sm text-surface-800 dark:text-surface-200">
        <Calendar className="w-3.5 h-3.5 text-brand-500 hidden sm:inline-block" />
        <select
          value={filters.selectedMonth}
          onChange={(e) => updateFilter('selectedMonth', Number(e.target.value))}
          className="bg-transparent font-semibold cursor-pointer focus:outline-none text-surface-900 dark:text-surface-100"
        >
          {MONTH_NAMES.map((m, idx) => (
            <option key={m} value={idx + 1} className="bg-white dark:bg-surface-800">
              {m}
            </option>
          ))}
        </select>

        {/* Year Dropdown */}
        <select
          value={filters.selectedYear}
          onChange={(e) => updateFilter('selectedYear', Number(e.target.value))}
          className="bg-transparent font-semibold cursor-pointer focus:outline-none text-surface-600 dark:text-surface-400"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y} className="bg-white dark:bg-surface-800">
              {y}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleNextMonth}
        title="Next Month"
        className="p-1.5 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
