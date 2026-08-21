import React, { useState } from 'react';
import { useGroups } from '../../context/GroupContext';
import { useExpenses } from '../../context/ExpenseContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Copy, Check, ShieldCheck, UserCheck, Share2 } from 'lucide-react';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({ isOpen, onClose }) => {
  const { activeGroup, groupMembers, memberSummaries } = useGroups();
  const { addToast } = useExpenses();
  const [copied, setCopied] = useState(false);

  if (!activeGroup) return null;

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
          title: `Join ${activeGroup.name} on ExpenseTracker`,
          text: `Join our group "${activeGroup.name}" on ExpenseTracker using invite code: ${activeGroup.join_code}`,
          url: window.location.href,
        });
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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

        {/* Members List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-surface-500">
            <span>Group Members</span>
            <span>Total Contributed</span>
          </div>

          <div className="divide-y divide-surface-100 dark:divide-surface-800 max-h-72 overflow-y-auto pr-1">
            {memberSummaries.map((m) => (
              <div key={m.user_id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm shrink-0 border border-brand-200 dark:border-brand-800">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-surface-900 dark:text-surface-100 truncate">
                        {m.name}
                      </span>
                      {m.role === 'admin' ? (
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

                <div className="text-right shrink-0">
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
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button type="button" variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
