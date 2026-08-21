import React, { useState } from 'react';
import { useGroups } from '../../context/GroupContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ isOpen, onClose }) => {
  const { joinGroup } = useGroups();
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Natural typing handler with full backspace/delete support
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJoinCode(e.target.value.toUpperCase());
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim();
    if (!clean) {
      setError('Please enter a group invite code.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const { error: joinErr } = await joinGroup(clean);
    setIsLoading(false);

    if (joinErr) {
      setError(joinErr.message || 'Invalid join code. Please check with your group admin.');
    } else {
      setJoinCode('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        setJoinCode('');
        onClose();
      }}
      title="Join an Existing Group"
      subtitle="Enter the invite code shared by the group admin to join the workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium animate-slide-up">
            {error}
          </div>
        )}

        <Input
          label="Group Invite Code *"
          type="text"
          placeholder="e.g. EXP-98A4 or 98A4"
          value={joinCode}
          onChange={handleInputChange}
          leftIcon={<KeyRound className="w-4 h-4 text-surface-400" />}
          required
          autoFocus
          helperText="Format: EXP-XXXX or just XXXX (Case-insensitive)"
          className="font-mono uppercase tracking-widest text-center text-base"
        />

        <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs text-surface-600 dark:text-surface-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-surface-800 dark:text-surface-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Instant Membership</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Joining allows you to log shared expenses, view fair splits, and settle balances in real-time.
          </p>
        </div>

        <div className="flex gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setError(null);
              setJoinCode('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 flex items-center justify-center gap-2 font-bold"
          >
            <span>Join Group</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Modal>
  );
};
