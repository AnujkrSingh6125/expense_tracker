import React, { useState } from 'react';
import { useGroups } from '../../context/GroupContext';
import { useExpenses } from '../../context/ExpenseContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Group } from '../../types';
import {
  Users,
  Plus,
  KeyRound,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  WifiOff,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface GroupListViewProps {
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
}

export const GroupListView: React.FC<GroupListViewProps> = ({
  onOpenCreateGroup,
  onOpenJoinGroup,
}) => {
  const { groups, setActiveGroupId, isOnline, isSyncing, pendingSyncCount, syncPendingQueue } = useGroups();
  const { addToast } = useExpenses();
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);

  const handleCopyCode = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    navigator.clipboard.writeText(group.join_code);
    setCopiedGroupId(group.id);
    addToast({
      type: 'success',
      title: 'Invite Code Copied',
      message: `Join code "${group.join_code}" copied to clipboard!`,
    });
    setTimeout(() => setCopiedGroupId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Collaborative Split Spaces</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Group Expenses & Fair Settlements
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
            Split trips, flat rents, dinners, and events with real-time fair share calculations and WhatsApp-style offline synchronization.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenJoinGroup}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md font-bold"
          >
            <KeyRound className="w-4 h-4 mr-1.5" />
            <span>Join with Code</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onOpenCreateGroup}
            className="bg-white text-brand-700 hover:bg-brand-50 shadow-md font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create Group</span>
          </Button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Offline Sync Status Pill */}
      {!isOnline && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Offline Mode:</strong> You can create groups and log expenses without internet. Changes will sync automatically when reconnected.
            </span>
          </div>
          {pendingSyncCount > 0 && (
            <Badge variant="warning">
              {pendingSyncCount} Pending
            </Badge>
          )}
        </div>
      )}

      {isOnline && pendingSyncCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-900 dark:text-brand-200 flex items-center justify-between gap-3 text-xs">
          <span>
            You have <strong>{pendingSyncCount} pending change{pendingSyncCount > 1 ? 's' : ''}</strong> queued for upload.
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            isLoading={isSyncing}
            onClick={syncPendingQueue}
            className="text-xs py-1 h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
          </Button>
        </div>
      )}

      {/* Groups Grid List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Your Active Groups ({groups.length})</span>
          </h2>
        </div>

        {groups.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-inner">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
                No Collaborative Groups Yet
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Create a new group for your friends or join an existing one using an invite code.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onOpenJoinGroup}>
                <KeyRound className="w-4 h-4 mr-1.5" />
                <span>Join with Code</span>
              </Button>
              <Button type="button" size="sm" onClick={onOpenCreateGroup} className="bg-brand-600 hover:bg-brand-700">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Create First Group</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className="group relative p-5 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Group Name + Copy Invite Code */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-extrabold text-base text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      title="Copy invite code"
                      onClick={(e) => handleCopyCode(e, group)}
                      className="p-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-surface-500 hover:text-brand-600 transition-colors shrink-0 flex items-center gap-1 text-[11px] font-mono font-bold"
                    >
                      {copiedGroupId === group.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{group.join_code}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Stats & Enter Arrow */}
                <div className="pt-4 mt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {group.member_count || 1} Member{group.member_count === 1 ? '' : 's'}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-surface-700 dark:text-surface-300">{group.currency}</span>
                  </div>

                  <div className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Space</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
