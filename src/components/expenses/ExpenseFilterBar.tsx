import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { STANDARD_CATEGORIES, PAYMENT_METHODS, DEFAULT_DOMAINS } from '../../lib/constants';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, RotateCcw } from 'lucide-react';

export const ExpenseFilterBar: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useExpenses();
  const { profile } = useAuth();
  const availableDomains = ['All', ...(profile?.custom_domains || DEFAULT_DOMAINS)];

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-3">
      {/* Top Search & Reset Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by note, category, domain, or payment method..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full"
          />
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-surface-100 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700/60 shrink-0">
          <button
            onClick={() => updateFilter('viewMode', 'month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.viewMode === 'month'
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            Month View
          </button>
          <button
            onClick={() => updateFilter('viewMode', 'year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.viewMode === 'year'
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            Year View
          </button>
          <button
            onClick={() => updateFilter('viewMode', 'custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.viewMode === 'custom'
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {/* Category Domain Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-xs text-surface-800 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="All">All Categories</option>
            {STANDARD_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Expense Domain Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1">
            Domain Tag
          </label>
          <select
            value={filters.domain || 'All'}
            onChange={(e) => updateFilter('domain', e.target.value)}
            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-xs text-surface-800 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {availableDomains.map((dom) => (
              <option key={dom} value={dom}>
                {dom === 'All' ? 'All Domains' : dom}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1">
            Payment Method
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => updateFilter('paymentMethod', e.target.value)}
            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-xs text-surface-800 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="All">All Methods</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-xs text-surface-800 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="date-desc">Date: Newest First</option>
            <option value="date-asc">Date: Oldest First</option>
            <option value="amount-desc">Amount: Highest First</option>
            <option value="amount-asc">Amount: Lowest First</option>
          </select>
        </div>

        {/* Reset Filters */}
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="w-full text-xs text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Custom Date Range if active */}
      {filters.viewMode === 'custom' && (
        <div className="pt-2 border-t border-surface-100 dark:border-surface-800 grid grid-cols-2 gap-3 animate-slide-up">
          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
