import React from 'react';
import { ActiveTab, AppSpace } from '../../types';
import { LayoutDashboard, ReceiptText, Plus, Settings, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  appSpace: AppSpace;
  setAppSpace: (space: AppSpace) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddExpense: () => void;
  onOpenAddGroupExpense?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  appSpace,
  setAppSpace,
  activeTab,
  setActiveTab,
  onOpenAddExpense,
  onOpenAddGroupExpense,
}) => {
  const handleAddClick = () => {
    if (appSpace === 'groups' && onOpenAddGroupExpense) {
      onOpenAddGroupExpense();
    } else {
      onOpenAddExpense();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl border-t border-surface-200/80 dark:border-surface-800/80 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Personal Dashboard */}
        <button
          type="button"
          onClick={() => {
            setAppSpace('personal');
            setActiveTab('dashboard');
          }}
          className={cn(
            'flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-1 p-1 rounded-2xl transition-all active:scale-95',
            appSpace === 'personal' && activeTab === 'dashboard'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 font-medium'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* 2. Personal Ledger / Analytics */}
        <button
          type="button"
          onClick={() => {
            setAppSpace('personal');
            setActiveTab('expenses');
          }}
          className={cn(
            'flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-1 p-1 rounded-2xl transition-all active:scale-95',
            appSpace === 'personal' && activeTab === 'expenses'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 font-medium'
          )}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Ledger</span>
        </button>

        {/* 3. Floating Center Action Button (+) */}
        <div className="-mt-7 shrink-0 px-1">
          <button
            type="button"
            onClick={handleAddClick}
            title={appSpace === 'groups' ? 'Log Group Expense' : 'Add Personal Expense'}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-brand-500/35 active:scale-90 hover:scale-105 transition-all ring-4 ring-white dark:ring-surface-900 focus:outline-none"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
        </div>

        {/* 4. Collaborative Groups */}
        <button
          type="button"
          onClick={() => setAppSpace('groups')}
          className={cn(
            'flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-1 p-1 rounded-2xl transition-all active:scale-95',
            appSpace === 'groups'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 font-medium'
          )}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Groups</span>
        </button>

        {/* 5. Settings / Security */}
        <button
          type="button"
          onClick={() => {
            setAppSpace('personal');
            setActiveTab('settings');
          }}
          className={cn(
            'flex flex-col items-center justify-center min-w-[52px] min-h-[44px] gap-1 p-1 rounded-2xl transition-all active:scale-95',
            appSpace === 'personal' && activeTab === 'settings'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 font-medium'
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </button>
      </div>
    </nav>
  );
};
