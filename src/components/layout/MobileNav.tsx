import React from 'react';
import { ActiveTab, AppSpace } from '../../types';
import { LayoutDashboard, PieChart, Plus, Settings, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  appSpace: AppSpace;
  setAppSpace: (space: AppSpace) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddExpense: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  appSpace,
  setAppSpace,
  activeTab,
  setActiveTab,
  onOpenAddExpense,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-900/95 backdrop-blur-lg border-t border-surface-200 dark:border-surface-800 px-3 py-2">
      <div className="flex items-center justify-around">
        {/* Dashboard */}
        <button
          onClick={() => {
            setAppSpace('personal');
            setActiveTab('dashboard');
          }}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
            appSpace === 'personal' && activeTab === 'dashboard'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => {
            setAppSpace('personal');
            setActiveTab('analytics');
          }}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
            appSpace === 'personal' && activeTab === 'analytics'
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

        {/* Collaborative Groups */}
        <button
          onClick={() => setAppSpace('groups')}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
            appSpace === 'groups'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
          )}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Groups</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            setAppSpace('personal');
            setActiveTab('settings');
          }}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors',
            appSpace === 'personal' && activeTab === 'settings'
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
