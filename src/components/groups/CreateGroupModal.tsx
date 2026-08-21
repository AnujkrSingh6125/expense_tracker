import React, { useState } from 'react';
import { useGroups } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CURRENCIES } from '../../lib/constants';
import { Users, FileText, Sparkles } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { createGroup } = useGroups();
  const { profile } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState(profile?.currency || '₹');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const { error: createErr } = await createGroup(name.trim(), description.trim() || undefined, currency);
    setIsLoading(false);

    if (createErr) {
      setError(createErr.message || 'Failed to create group.');
    } else {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Collaborative Group"
      subtitle="Establish a shared expense space for trips, flatmates, or events."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Group Name *"
          type="text"
          placeholder="e.g., Goa Trip 2026, Flat 402 Bills"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<Users className="w-4 h-4 text-surface-400" />}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
            Description (Optional)
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none text-surface-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              placeholder="What is this group tracking? (e.g. Flight tickets, resort stay, food & fuel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-10 pr-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 font-medium placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
            Group Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
          <p className="text-xs text-brand-900 dark:text-brand-200 leading-relaxed">
            A unique <strong>6-digit alphanumeric invite code</strong> (e.g. <code className="px-1 py-0.5 bg-brand-100 dark:bg-brand-900 rounded font-mono text-brand-700 dark:text-brand-300">EXP-98A4</code>) will be generated automatically so other members can join with 1 click.
          </p>
        </div>

        <div className="flex gap-3 pt-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1 bg-brand-600 hover:bg-brand-700">
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
};
