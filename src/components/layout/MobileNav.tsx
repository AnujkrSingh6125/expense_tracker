import React from 'react';
import { ActiveTab } from '../../types';
import { LayoutDashboard, PieChart, ReceiptText, Plus, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddExpense: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddExpense,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-900/95 backdrop-blur-lg border-t border-surface-200 dark:border-surface-800 px-3 py-2">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
            activeTab === 'dashboard'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
            activeTab === 'analytics'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
          )}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Analytics</span>
        </button>

        {/* Floating Center Plus Button */}
        <div className="-mt-6">
          <button
            onClick={onOpenAddExpense}
            className="w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/40 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Transactions */}
        <button
          onClick={() => setActiveTab('expenses')}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
            activeTab === 'expenses'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
          )}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Activity</span>
        </button>

        {/* Settings / Budgets */}
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
            activeTab === 'settings'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Settings</span>
        </button>
      </div>
    </nav>
  );
};
