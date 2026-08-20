import React from 'react';
import { Expense } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { MONTH_NAMES } from '../../lib/constants';
import { MetricCards } from './MetricCards';
import { BudgetProgressBar } from './BudgetProgressBar';
import { QuickActions } from './QuickActions';
import { RecentExpenses } from './RecentExpenses';
import { DomainComparisonChart } from '../analytics/DomainComparisonChart';
import { MonthlySpendingBarChart } from '../analytics/MonthlySpendingBarChart';

interface DashboardViewProps {
  onOpenAddExpense: () => void;
  onOpenEditExpense: (expense: Expense) => void;
  onOpenBudgetModal: () => void;
  onViewAllExpenses: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddExpense,
  onOpenEditExpense,
  onOpenBudgetModal,
  onViewAllExpenses,
}) => {
  const { profile, user } = useAuth();
  const { filters } = useExpenses();

  const monthName = MONTH_NAMES[filters.selectedMonth - 1];
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
            Welcome back, {userName}
          </h2>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            Tracking insights for <span className="font-semibold text-brand-600 dark:text-brand-400">{monthName} {filters.selectedYear}</span>
          </p>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <MetricCards />

      {/* Monthly Budget Progress Bar with Dynamic Alerting */}
      <BudgetProgressBar onOpenBudgetModal={onOpenBudgetModal} />

      {/* Quick Action Pills & Buttons */}
      <QuickActions
        onOpenAddExpense={onOpenAddExpense}
        onOpenBudgetModal={onOpenBudgetModal}
        onViewAllExpenses={onViewAllExpenses}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DomainComparisonChart />
        <MonthlySpendingBarChart />
      </div>

      {/* Recent Transactions Section */}
      <RecentExpenses
        onOpenAddExpense={onOpenAddExpense}
        onOpenEditExpense={onOpenEditExpense}
        onViewAllExpenses={onViewAllExpenses}
      />
    </div>
  );
};
