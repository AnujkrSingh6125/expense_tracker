import React, { useState, useEffect } from 'react';
import { Expense, PaymentMethod } from '../../types';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { STANDARD_CATEGORIES, PAYMENT_METHODS, DEFAULT_DOMAINS, getDomainMeta } from '../../lib/constants';
import { Calendar, Tag, AlignLeft, Layers, Plus, Check } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { addExpense, updateExpense } = useExpenses();
  const { profile } = useAuth();
  const currency = profile?.currency || '₹';
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Grocery');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [domain, setDomain] = useState<string>('Personal');
  const [isAddingCustomDomain, setIsAddingCustomDomain] = useState<boolean>(false);
  const [newDomainInput, setNewDomainInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const availableDomains = profile?.custom_domains || DEFAULT_DOMAINS;

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount.toString());
      const isStandard = STANDARD_CATEGORIES.some((c) => c.id === expenseToEdit.category);
      if (isStandard) {
        setCategory(expenseToEdit.category);
        setIsCustomCategory(false);
        setCustomCategory('');
      } else {
        setCategory('Custom');
        setIsCustomCategory(true);
        setCustomCategory(expenseToEdit.category);
      }
      setDomain(expenseToEdit.domain || 'Personal');
      setDescription(expenseToEdit.description || '');
      setPaymentMethod(expenseToEdit.payment_method);
      setExpenseDate(expenseToEdit.expense_date);
    } else {
      // Reset defaults
      setAmount('');
      setCategory('Grocery');
      setIsCustomCategory(false);
      setCustomCategory('');
      setDomain('Personal');
      setDescription('');
      setPaymentMethod('Card');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
    setIsAddingCustomDomain(false);
    setNewDomainInput('');
    setError(null);
  }, [expenseToEdit, isOpen]);

  const handleCategorySelect = (selected: string) => {
    if (selected === 'Custom') {
      setIsCustomCategory(true);
      setCategory('Custom');
    } else {
      setIsCustomCategory(false);
      setCategory(selected);
    }
  };

  const handleCreateCustomDomain = () => {
    const trimmed = newDomainInput.trim();
    if (!trimmed) return;
    setDomain(trimmed);
    setIsAddingCustomDomain(false);
    setNewDomainInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'Custom') : category;

    setIsLoading(true);

    if (expenseToEdit) {
      const { error } = await updateExpense(expenseToEdit.id, {
        amount: parsedAmount,
        category: finalCategory,
        domain: domain.trim() || 'Personal',
        description: description.trim() || null,
        payment_method: paymentMethod,
        expense_date: expenseDate,
      });
      setIsLoading(false);
      if (error) {
        setError(error.message);
      } else {
        onClose();
      }
    } else {
      const { error } = await addExpense({
        amount: parsedAmount,
        category: finalCategory,
        domain: domain.trim() || 'Personal',
        description: description.trim() || null,
        payment_method: paymentMethod,
        expense_date: expenseDate,
      });
      setIsLoading(false);
      if (error) {
        setError(error.message);
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Transaction' : 'Record New Expense'}
      subtitle={
        expenseToEdit
          ? 'Update expense amount, domain, or payment method'
          : 'Log your transaction to keep your budget on target'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
            Amount ({currency})
          </label>
          <div className="relative rounded-2xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-surface-400 font-bold text-lg">
              {currency}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              className="block w-full rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/90 pl-10 pr-4 py-3 text-2xl font-extrabold text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Category Domain Selection Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
            Spending Domain / Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {STANDARD_CATEGORIES.map((cat) => {
              const isSelected = !isCustomCategory && category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                      : 'border-surface-200 dark:border-surface-700/60 bg-white dark:bg-surface-800/60 hover:bg-surface-50 dark:hover:bg-surface-800'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mb-1.5"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Category Input if selected */}
          {isCustomCategory && (
            <div className="pt-1 animate-slide-up">
              <Input
                placeholder="Enter custom category name (e.g. Pet Care, Education)"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                leftIcon={<Tag className="w-4 h-4" />}
                required={isCustomCategory}
              />
            </div>
          )}
        </div>

        {/* Custom Domain / Workspace Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-500" />
              <span>Workspace / Expense Domain</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCustomDomain(!isAddingCustomDomain)}
              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingCustomDomain ? 'Cancel Custom' : 'New Domain Tag'}</span>
            </button>
          </div>

          {/* Quick Domain Tag Pills */}
          <div className="flex flex-wrap gap-1.5">
            {availableDomains.map((dom) => {
              const meta = getDomainMeta(dom);
              const isSelected = domain === dom;
              return (
                <button
                  key={dom}
                  type="button"
                  onClick={() => {
                    setDomain(dom);
                    setIsAddingCustomDomain(false);
                  }}
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

          {/* Inline Custom Domain Input */}
          {isAddingCustomDomain && (
            <div className="flex items-center gap-2 pt-1 animate-slide-up">
              <input
                type="text"
                placeholder="New domain name (e.g. Side-Hustle, Europe-Trip)"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCustomDomain();
                  }
                }}
                className="flex-1 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-xs text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:outline-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCustomDomain}
                disabled={!newDomainInput.trim()}
              >
                Add Tag
              </Button>
            </div>
          )}
        </div>

        {/* Description / Note */}
        <Input
          label="Description / Note"
          placeholder="e.g. Weekly grocery haul, Dinner bill with Alex"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          leftIcon={<AlignLeft className="w-4 h-4" />}
        />

        {/* Payment Method & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/80 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expense Date */}
          <Input
            label="Expense Date"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-100 dark:border-surface-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {expenseToEdit ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
