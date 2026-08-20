import React from 'react';
import { ActiveTab } from '../../types';
import { useExpenses } from '../../context/ExpenseContext';
import { useSecurity } from '../../context/SecurityContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import {
  LayoutDashboard,
  PieChart,
  ReceiptText,
  Target,
  Settings,
  Lock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSecuritySettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSecuritySettings,
}) => {
  const { metrics } = useExpenses();
  const { profile } = useAuth();
  const { hasSecurityConfigured, lockApp } = useSecurity();

  const currency = profile?.currency || '₹';

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'analytics',
      label: 'Domain Analytics',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      id: 'expenses',
      label: 'All Transactions',
      icon: <ReceiptText className="w-5 h-5" />,
    },
    {
      id: 'budgets',
      label: 'Monthly Budgets',
      icon: <Target className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings & Security',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 min-h-[calc(100vh-4rem)] p-4 justify-between transition-colors">
      <div className="space-y-6">
        {/* Navigation links */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left',
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Monthly Budget Summary Snapshot Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-surface-50 to-surface-100/60 dark:from-surface-800/60 dark:to-surface-800/30 border border-surface-200 dark:border-surface-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400">
              This Month Spend
            </span>
            {metrics.isOverBudget && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-3 h-3" /> Exceeded
              </span>
            )}
          </div>

          <div className="text-xl font-extrabold text-surface-900 dark:text-surface-100">
            {formatCurrency(metrics.totalSpentThisMonth, currency)}
          </div>

          {metrics.monthlyBudget ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-surface-500">
                <span>Budget: {formatCurrency(metrics.monthlyBudget, currency)}</span>
                <span className="font-semibold">{metrics.budgetPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    metrics.isOverBudget
                      ? 'bg-rose-500'
                      : metrics.isNearThreshold
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(metrics.budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-surface-400">No budget limit set for this month.</p>
          )}
        </div>
      </div>

      {/* Security lock & status card at bottom */}
      <div className="pt-4 border-t border-surface-100 dark:border-surface-800 space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={cn(
                'w-4 h-4',
                hasSecurityConfigured ? 'text-emerald-500' : 'text-surface-400'
              )}
            />
            <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
              {hasSecurityConfigured ? 'App Lock Active' : 'Lock Not Set'}
            </span>
          </div>

          {hasSecurityConfigured ? (
            <button
              onClick={lockApp}
              title="Lock Dashboard Now"
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Lock className="w-3 h-3" /> Lock
            </button>
          ) : (
            <button
              onClick={onOpenSecuritySettings}
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Set PIN
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
