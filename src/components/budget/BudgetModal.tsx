import React, { useState, useEffect } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MONTH_NAMES } from '../../lib/constants';
import { Target, AlertTriangle } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose }) => {
  const { currentMonthBudget, setMonthlyBudget, filters } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';

  const [amountLimit, setAmountLimit] = useState<string>('');
  const [thresholdPct, setThresholdPct] = useState<number>(80);
  const [selectedMonth, setSelectedMonth] = useState<number>(filters.selectedMonth);
  const [selectedYear, setSelectedYear] = useState<number>(filters.selectedYear);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(filters.selectedMonth);
      setSelectedYear(filters.selectedYear);
      if (currentMonthBudget) {
        setAmountLimit(currentMonthBudget.amount_limit.toString());
        setThresholdPct(currentMonthBudget.alert_threshold_pct || 80);
      } else {
        setAmountLimit('');
        setThresholdPct(80);
      }
      setError(null);
    }
  }, [isOpen, currentMonthBudget, filters.selectedMonth, filters.selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const limit = parseFloat(amountLimit);
    if (isNaN(limit) || limit <= 0) {
      setError('Please enter a valid monthly budget limit amount.');
      return;
    }

    setIsLoading(true);
    const { error } = await setMonthlyBudget(selectedMonth, selectedYear, limit, thresholdPct);
    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      onClose();
    }
  };

  const monthName = MONTH_NAMES[selectedMonth - 1];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Establish Monthly Budget"
      subtitle={`Configure overall ceiling and proactive alert threshold for ${monthName} ${selectedYear}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Month / Year selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget Limit Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
            Monthly Expense Limit ({currency})
          </label>
          <div className="relative rounded-2xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-surface-400 font-bold text-lg">
              {currency}
            </div>
            <input
              type="number"
              step="1"
              min="1"
              inputMode="decimal"
              placeholder="e.g. 45000"
              value={amountLimit}
              onChange={(e) => setAmountLimit(e.target.value)}
              required
              autoFocus
              className="block w-full rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/90 pl-10 pr-4 py-3 text-2xl font-extrabold text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Smart Alert Threshold Slider */}
        <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-bold text-surface-900 dark:text-surface-100">
                Proactive Alert Threshold
              </label>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {thresholdPct}%
            </span>
          </div>

          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={thresholdPct}
            onChange={(e) => setThresholdPct(Number(e.target.value))}
            className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />

          <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-relaxed">
            When total expenses cross <strong>{thresholdPct}%</strong>{' '}
            {amountLimit && !isNaN(parseFloat(amountLimit)) && (
              <span>({currency}{((parseFloat(amountLimit) * thresholdPct) / 100).toFixed(0)})</span>
            )}
            , the system immediately sends toast alerts so you can curb discretionary spending.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-100 dark:border-surface-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} leftIcon={<Target className="w-4 h-4" />}>
            Save Budget Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
};
