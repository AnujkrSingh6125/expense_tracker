import React from 'react';
import { ActiveTab, AppSpace } from '../../types';
import { useExpenses } from '../../context/ExpenseContext';
import { useSecurity } from '../../context/SecurityContext';
import { useAuth } from '../../context/AuthContext';
import { useGroups } from '../../context/GroupContext';
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
  Users,
  User,
  Plus,
  KeyRound,
  FolderOpen,
  WifiOff,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  appSpace: AppSpace;
  setAppSpace: (space: AppSpace) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSecuritySettings: () => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  appSpace,
  setAppSpace,
  activeTab,
  setActiveTab,
  onOpenSecuritySettings,
  onOpenCreateGroup,
  onOpenJoinGroup,
}) => {
  const { metrics } = useExpenses();
  const { profile } = useAuth();
  const { hasSecurityConfigured, lockApp } = useSecurity();
  const {
    groups,
    activeGroup,
    setActiveGroupId,
    isOnline,
    pendingSyncCount,
  } = useGroups();

  const currency = profile?.currency || '₹';

  const personalNavItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
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
      <div className="space-y-5">
        {/* Top Space Switcher Tabs: Personal vs Groups */}
        <div className="space-y-1.5">
          <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Active Workspace
          </p>
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/60">
            <button
              type="button"
              onClick={() => setAppSpace('personal')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all',
                appSpace === 'personal'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              )}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal</span>
            </button>

            <button
              type="button"
              onClick={() => setAppSpace('groups')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all relative',
                appSpace === 'groups'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Groups</span>
              {groups.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {groups.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Space-Specific Menu Section */}
        {appSpace === 'personal' ? (
          /* PERSONAL NAVIGATION */
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
              Personal Menu
            </p>
            {personalNavItems.map((item) => {
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
        ) : (
          /* COLLABORATIVE GROUPS NAVIGATION */
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Your Groups ({groups.length})
              </p>
            </div>

            {/* All Groups list button */}
            <button
              onClick={() => setActiveGroupId(null)}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left',
                activeGroup === null
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
              )}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5" />
                <span>All Groups Overview</span>
              </div>
            </button>

            {/* Individual Group Item Pills */}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {groups.map((g) => {
                const isCurrentActive = activeGroup?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroupId(g.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left truncate',
                      isCurrentActive
                        ? 'bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                    )}
                  >
                    <span className="truncate">{g.name}</span>
                    <span className="text-[10px] font-mono text-surface-400 shrink-0 ml-1">
                      {g.currency}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Action buttons: Create & Join */}
            <div className="pt-2 space-y-1.5">
              <button
                type="button"
                onClick={onOpenCreateGroup}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Group</span>
              </button>

              <button
                type="button"
                onClick={onOpenJoinGroup}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>Join with Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Space Specific Cards */}
        {appSpace === 'personal' ? (
          /* Monthly Budget Summary Snapshot Card */
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
        ) : (
          /* Offline & Realtime Sync Status Card */
          <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-surface-700 dark:text-surface-300">
              <span>Sync Engine</span>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px]">
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-surface-400 leading-snug">
              {pendingSyncCount > 0
                ? `${pendingSyncCount} offline transaction(s) queued for sync.`
                : 'All changes synced with cloud storage.'}
            </p>
          </div>
        )}
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
