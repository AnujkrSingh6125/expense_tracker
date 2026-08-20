import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { exportExpensesToCSV } from '../../lib/exportUtils';
import { STANDARD_CATEGORIES } from '../../lib/constants';
import { Button } from '../ui/Button';
import { Plus, Download } from 'lucide-react';

interface QuickActionsProps {
  onOpenAddExpense: () => void;
  onOpenBudgetModal?: () => void;
  onViewAllExpenses?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenAddExpense,
}) => {
  const { filteredExpenses, filters, updateFilter } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const handleExport = () => {
    exportExpensesToCSV(filteredExpenses, currency, `expenses-${filters.selectedYear}-${filters.selectedMonth}.csv`);
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2">
      {/* Category domain quick filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-none">
        <button
          onClick={() => updateFilter('category', 'All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filters.category === 'All'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700'
          }`}
        >
          All Domains
        </button>

        {STANDARD_CATEGORIES.slice(0, 6).map((cat) => {
          const isSelected = filters.category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => updateFilter('category', isSelected ? 'All' : cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isSelected ? '#ffffff' : cat.color }}
              />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          Export CSV
        </Button>
        <Button
          size="sm"
          onClick={onOpenAddExpense}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          New Expense
        </Button>
      </div>
    </div>
  );
};
