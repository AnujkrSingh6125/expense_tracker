import React, { useState } from 'react';
import { useGroups } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Copy,
  Check,
  ShieldCheck,
  UserCheck,
  Share2,
  Crown,
  UserMinus,
  LogOut,
  Trash2,
  AlertTriangle,
  Shield,
  ShieldAlert,
} from 'lucide-react';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({ isOpen, onClose }) => {
  const {
    activeGroup,
    groupMembers,
    memberSummaries,
    isAdmin,
    leaveGroup,
    removeMember,
    updateMemberRole,
    deleteGroup,
  } = useGroups();
  const { user } = useAuth();
  const { addToast } = useExpenses();

  const [copied, setCopied] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'leave' | 'delete_group' | 'remove_member' | 'toggle_admin';
    targetUserId?: string;
    targetUserName?: string;
    targetRole?: 'admin' | 'member';
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeGroup) return null;

  const currentUserId = user?.id || 'demo-user-12345';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeGroup.join_code);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Invite Code Copied',
      message: `Code "${activeGroup.join_code}" copied to clipboard. Share it with your friends!`,
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${activeGroup.name} on Master Tracker`,
          text: `Join our group "${activeGroup.name}" on Master Tracker using invite code: ${activeGroup.join_code}`,
          url: window.location.href,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleExecuteAction = async () => {
    if (!confirmAction) return;
    setIsSubmitting(true);

    try {
      if (confirmAction.type === 'leave') {
        const { error } = await leaveGroup(activeGroup.id);
        if (!error) {
          setConfirmAction(null);
          onClose();
        }
      } else if (confirmAction.type === 'delete_group') {
        const { error } = await deleteGroup(activeGroup.id);
        if (!error) {
          setConfirmAction(null);
          onClose();
        }
      } else if (confirmAction.type === 'remove_member' && confirmAction.targetUserId) {
        await removeMember(activeGroup.id, confirmAction.targetUserId);
        setConfirmAction(null);
      } else if (confirmAction.type === 'toggle_admin' && confirmAction.targetUserId && confirmAction.targetRole) {
        await updateMemberRole(activeGroup.id, confirmAction.targetUserId, confirmAction.targetRole);
        setConfirmAction(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setConfirmAction(null);
        onClose();
      }}
      title={`${activeGroup.name} — Members`}
      subtitle={`${groupMembers.length} member${groupMembers.length === 1 ? '' : 's'} participating in this expense group.`}
    >
      <div className="space-y-5">
        {/* Invite Code Share Card */}
        <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Group Invite Code
            </div>
            <div className="text-xl font-extrabold font-mono text-brand-950 dark:text-brand-50 tracking-wider">
              {activeGroup.join_code}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="flex-1 sm:flex-none border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleShare}
              className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              <span>Share</span>
            </Button>
          </div>
        </div>

        {/* Confirmation Inline Banner if an action is pending */}
        {confirmAction && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-3 animate-slide-up">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  {confirmAction.type === 'leave' && 'Leave this Group?'}
                  {confirmAction.type === 'delete_group' && 'Delete Entire Group Permanently?'}
                  {confirmAction.type === 'remove_member' && `Kick out ${confirmAction.targetUserName}?`}
                  {confirmAction.type === 'toggle_admin' &&
                    `${confirmAction.targetRole === 'admin' ? 'Promote' : 'Demote'} ${confirmAction.targetUserName}?`}
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  {confirmAction.type === 'leave' &&
                    'You will lose access to this group dashboard and split records until re-invited.'}
                  {confirmAction.type === 'delete_group' &&
                    'This will permanently delete the group, all recorded expenses, and settlements for all members. This cannot be undone.'}
                  {confirmAction.type === 'remove_member' &&
                    'This member will be removed from future expense calculations and splits.'}
                  {confirmAction.type === 'toggle_admin' &&
                    `They will ${
                      confirmAction.targetRole === 'admin'
                        ? 'gain admin privileges to manage members, delete expenses, and promote others.'
                        : 'revert to regular member permissions.'
                    }`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleExecuteAction}
                isLoading={isSubmitting}
                className={
                  confirmAction.type === 'toggle_admin'
                    ? 'bg-brand-600 hover:bg-brand-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }
              >
                Confirm
              </Button>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-surface-500">
            <span>Group Members</span>
            <span>Total Contributed</span>
          </div>

          {memberSummaries.length <= 1 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Only you are in this group right now. Share the invite code to add friends!</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="shrink-0 text-xs border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                {copied ? 'Copied' : 'Copy Code'}
              </Button>
            </div>
          )}

          <div className="divide-y divide-surface-100 dark:divide-surface-800 max-h-72 overflow-y-auto pr-1">
            {memberSummaries.map((m) => {
              const isSelf = m.user_id === currentUserId;
              const isMemberAdmin = m.role === 'admin';
              const isCreator = activeGroup.created_by === m.user_id;

              return (
                <div key={m.user_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm shrink-0 border border-brand-200 dark:border-brand-800">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-surface-900 dark:text-surface-100 truncate">
                          {m.name} {isSelf && <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">(You)</span>}
                        </span>
                        {isCreator ? (
                          <Badge variant="info" className="gap-1 text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                            <Crown className="w-3 h-3 text-amber-500" />
                            <span>Creator / Admin</span>
                          </Badge>
                        ) : isMemberAdmin ? (
                          <Badge variant="info" className="gap-1 text-[10px] py-0 px-1.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Admin</span>
                          </Badge>
                        ) : (
                          <Badge variant="default" className="gap-1 text-[10px] py-0 px-1.5">
                            <UserCheck className="w-3 h-3" />
                            <span>Member</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-surface-400 truncate">{m.email || 'Group Participant'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Financial contribution */}
                    <div className="text-right">
                      <div className="text-sm font-bold text-surface-900 dark:text-surface-100">
                        {activeGroup.currency}
                        {m.total_paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          m.net_balance > 0.01
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : m.net_balance < -0.01
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-surface-400'
                        }`}
                      >
                        {m.net_balance > 0.01
                          ? `+${activeGroup.currency}${m.net_balance.toFixed(2)}`
                          : m.net_balance < -0.01
                          ? `-${activeGroup.currency}${Math.abs(m.net_balance).toFixed(2)}`
                          : 'Settled'}
                      </div>
                    </div>

                    {/* Admin Actions on this member (Only if current user is Admin & target is not self) */}
                    {isAdmin && !isSelf && (
                      <div className="flex items-center gap-1">
                        {/* Make Admin / Demote Button */}
                        {!isCreator && (
                          <button
                            type="button"
                            title={isMemberAdmin ? 'Demote to regular Member' : 'Make this user an Admin'}
                            onClick={() =>
                              setConfirmAction({
                                type: 'toggle_admin',
                                targetUserId: m.user_id,
                                targetUserName: m.name,
                                targetRole: isMemberAdmin ? 'member' : 'admin',
                              })
                            }
                            className="p-1.5 rounded-lg text-surface-500 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                          >
                            {isMemberAdmin ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Kick out / Remove button */}
                        {!isCreator && (
                          <button
                            type="button"
                            title={`Kick out ${m.name} from group`}
                            onClick={() =>
                              setConfirmAction({
                                type: 'remove_member',
                                targetUserId: m.user_id,
                                targetUserName: m.name,
                              })
                            }
                            className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group Governance Actions (Leave / Delete) */}
        <div className="pt-4 border-t border-surface-200 dark:border-surface-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Leave Group Button */}
            <button
              type="button"
              onClick={() => setConfirmAction({ type: 'leave' })}
              className="w-full sm:flex-1 py-2 px-3 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Leave Group</span>
            </button>

            {/* Admin Delete Group Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setConfirmAction({ type: 'delete_group' })}
                className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Group</span>
              </button>
            )}
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
