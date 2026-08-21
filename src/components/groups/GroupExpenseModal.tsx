import React, { useState, useEffect } from 'react';
import { useGroups } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { STANDARD_CATEGORIES, DEFAULT_DOMAINS, getDomainMeta } from '../../lib/constants';
import { SplitType, GroupExpense, CategoryMeta } from '../../types';
import { Receipt, DollarSign, Calendar, FileText, User, AlertCircle, Layers, Check } from 'lucide-react';

interface GroupExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: GroupExpense | null;
}

export const GroupExpenseModal: React.FC<GroupExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { activeGroup, groupMembers, addGroupExpense, updateGroupExpense } = useGroups();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Party/Dining');
  const [domain, setDomain] = useState('General');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = activeGroup?.currency || '₹';
  const currentUserId = user?.id || 'demo-user-12345';
  const availableDomains = ['General', ...(profile?.custom_domains || DEFAULT_DOMAINS)];

  // Initialize or reset form on open
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setTitle(expenseToEdit.title);
        setAmount(expenseToEdit.amount.toString());
        setCategory(expenseToEdit.category);
        setDomain(expenseToEdit.domain || 'General');
        setPaidBy(expenseToEdit.paid_by);
        setSplitType(expenseToEdit.split_type);
        setExpenseDate(expenseToEdit.expense_date);
        setNotes(expenseToEdit.notes || '');

        if (expenseToEdit.splits) {
          const splitsMap: Record<string, string> = {};
          expenseToEdit.splits.forEach((s) => {
            splitsMap[s.user_id] = s.owed_amount.toString();
          });
          setCustomSplits(splitsMap);
        }
      } else {
        setTitle('');
        setAmount('');
        setCategory('Party/Dining');
        setPaidBy(groupMembers.length > 0 ? currentUserId : '');
        setSplitType('equal');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setNotes('');

        // Pre-fill custom splits equally
        const initialCustom: Record<string, string> = {};
        groupMembers.forEach((m) => {
          initialCustom[m.user_id] = '0';
        });
        setCustomSplits(initialCustom);
      }
      setError(null);
    }
  }, [isOpen, expenseToEdit, groupMembers, currentUserId]);

  const numAmount = parseFloat(amount) || 0;
  const memberCount = groupMembers.length || 1;
  const equalPerPerson = numAmount > 0 ? (numAmount / memberCount).toFixed(2) : '0.00';

  // Custom split sum validation
  const customSum = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const customDiff = Math.round((numAmount - customSum) * 100) / 100;
  const isCustomValid = splitType === 'equal' || Math.abs(customDiff) < 0.01;

  const handleCustomSplitChange = (userId: string, val: string) => {
    setCustomSplits((prev) => ({
      ...prev,
      [userId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an expense title.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!paidBy) {
      setError('Please select who paid for this expense.');
      return;
    }
    if (splitType === 'custom' && !isCustomValid) {
      setError(`Custom splits sum (${currencySymbol}${customSum.toFixed(2)}) must match total expense (${currencySymbol}${numAmount.toFixed(2)}).`);
      return;
    }

    setError(null);
    setIsLoading(true);

    const parsedCustomAllocations: Record<string, number> = {};
    if (splitType === 'custom') {
      groupMembers.forEach((m) => {
        parsedCustomAllocations[m.user_id] = parseFloat(customSplits[m.user_id]) || 0;
      });
    }

    if (expenseToEdit) {
      const { error: updateErr } = await updateGroupExpense(
        expenseToEdit.id,
        {
          title: title.trim(),
          amount: numAmount,
          category,
          domain: domain || 'General',
          paid_by: paidBy,
          split_type: splitType,
          expense_date: expenseDate,
          notes: notes.trim() || undefined,
        },
        splitType === 'custom' ? parsedCustomAllocations : undefined
      );
      setIsLoading(false);
      if (updateErr) setError(updateErr.message);
      else onClose();
    } else {
      const { error: addErr } = await addGroupExpense(
        {
          title: title.trim(),
          amount: numAmount,
          category,
          domain: domain || 'General',
          paid_by: paidBy,
          split_type: splitType,
          expense_date: expenseDate,
          notes: notes.trim() || undefined,
        },
        splitType === 'custom' ? parsedCustomAllocations : undefined
      );
      setIsLoading(false);
      if (addErr) setError(addErr.message);
      else onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Group Expense' : 'Log Group Expense'}
      subtitle={`Record a shared payment in ${activeGroup?.name || 'Group'}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Expense Title *"
          type="text"
          placeholder="e.g. Seafood Dinner, Villa Booking, Fuel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          leftIcon={<Receipt className="w-4 h-4 text-surface-400" />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Amount (${currencySymbol}) *`}
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftIcon={<DollarSign className="w-4 h-4 text-surface-400" />}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {STANDARD_CATEGORIES.map((cat: CategoryMeta) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense Domain Tag Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-500" />
            <span>Expense Domain Tag</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableDomains.map((dom) => {
              const meta = getDomainMeta(dom);
              const isSelected = domain === dom;
              return (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setDomain(dom)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-surface-200 dark:border-surface-700/70 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700/50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{dom}</span>
                  {isSelected && <Check className="w-3 h-3 text-brand-600" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Paid By Member Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
              Paid By *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none text-surface-400">
                <User className="w-4 h-4" />
              </div>
              <select
                value={paidBy || currentUserId}
                onChange={(e) => setPaidBy(e.target.value)}
                className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-10 pr-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {groupMembers.length === 0 ? (
                  <option value={currentUserId}>
                    You ({user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Current User'})
                  </option>
                ) : (
                  groupMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user_id === currentUserId
                        ? `You (${m.profile?.full_name || 'Current User'})`
                        : m.profile?.full_name || m.profile?.email || 'Member'}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <Input
            label="Date *"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4 text-surface-400" />}
            required
          />
        </div>

        {/* Split Type Selector */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
            Split Configuration
          </label>
          <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <button
              type="button"
              onClick={() => setSplitType('equal')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                splitType === 'equal'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              }`}
            >
              Split Equally ({memberCount} members)
            </button>
            <button
              type="button"
              onClick={() => setSplitType('custom')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                splitType === 'custom'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              }`}
            >
              Custom Amounts
            </button>
          </div>

          {/* Equal Split Preview */}
          {splitType === 'equal' ? (
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 flex items-center justify-between text-xs text-brand-900 dark:text-brand-200">
              <span>Fair Share Per Member:</span>
              <span className="font-extrabold text-sm text-brand-700 dark:text-brand-300">
                {currencySymbol}
                {equalPerPerson} / person
              </span>
            </div>
          ) : (
            /* Custom Split Inputs */
            <div className="p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-surface-600 dark:text-surface-300">
                <span>Member Allocations</span>
                <span
                  className={`font-mono ${
                    isCustomValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {currencySymbol}
                  {customSum.toFixed(2)} / {currencySymbol}
                  {numAmount.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {groupMembers.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-surface-700 dark:text-surface-300 truncate">
                      {m.user_id === currentUserId
                        ? `You (${m.profile?.full_name || 'Me'})`
                        : m.profile?.full_name || 'Member'}
                    </span>
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-2 text-surface-400 text-xs">{currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customSplits[m.user_id] ?? '0'}
                        onChange={(e) => handleCustomSplitChange(m.user_id, e.target.value)}
                        className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 pl-6 pr-2 py-1.5 text-xs text-right font-mono font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {!isCustomValid && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Difference: {currencySymbol}
                    {Math.abs(customDiff).toFixed(2)} {customDiff > 0 ? 'remaining' : 'exceeded'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
            Notes / Receipt Details (Optional)
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none text-surface-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Paid via UPI, bill attached on WhatsApp"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-10 pr-3 py-2 text-sm text-surface-900 dark:text-surface-100 font-medium placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={splitType === 'custom' && !isCustomValid}
            className="flex-1 bg-brand-600 hover:bg-brand-700 font-bold"
          >
            {expenseToEdit ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
