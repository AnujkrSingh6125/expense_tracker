import { CategoryMeta, PaymentMethod } from '../types';

export const STANDARD_CATEGORIES: CategoryMeta[] = [
  {
    id: 'Grocery',
    name: 'Grocery',
    color: '#10B981', // Emerald
    bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    textColor: 'text-emerald-500',
    icon: 'ShoppingCart',
  },
  {
    id: 'Party/Dining',
    name: 'Party / Dining',
    color: '#F59E0B', // Amber
    bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    textColor: 'text-amber-500',
    icon: 'UtensilsCrossed',
  },
  {
    id: 'Rent',
    name: 'Rent & Housing',
    color: '#6366F1', // Indigo
    bgColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
    textColor: 'text-indigo-500',
    icon: 'Home',
  },
  {
    id: 'Utilities',
    name: 'Utilities',
    color: '#06B6D4', // Cyan
    bgColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
    textColor: 'text-cyan-500',
    icon: 'Zap',
  },
  {
    id: 'Transport',
    name: 'Transport',
    color: '#8B5CF6', // Purple
    bgColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
    textColor: 'text-purple-500',
    icon: 'Car',
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    color: '#EC4899', // Pink
    bgColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/40',
    textColor: 'text-pink-500',
    icon: 'ShoppingBag',
  },
  {
    id: 'Healthcare',
    name: 'Healthcare',
    color: '#EF4444', // Red
    bgColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40',
    textColor: 'text-red-500',
    icon: 'HeartPulse',
  },
  {
    id: 'Entertainment',
    name: 'Entertainment',
    color: '#3B82F6', // Blue
    bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
    textColor: 'text-blue-500',
    icon: 'Tv',
  },
  {
    id: 'Custom',
    name: 'Other / Custom',
    color: '#64748B', // Slate
    bgColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/40',
    textColor: 'text-slate-500',
    icon: 'Tag',
  },
];

export const EXPENSE_CATEGORIES = STANDARD_CATEGORIES;

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'Card', label: 'Credit / Debit Card', icon: 'CreditCard' },
  { id: 'UPI', label: 'UPI / Instant Pay', icon: 'Smartphone' },
  { id: 'Cash', label: 'Cash Payment', icon: 'Banknote' },
  { id: 'Bank Transfer', label: 'Bank Transfer', icon: 'Landmark' },
];

export const CURRENCIES = [
  { code: '₹', name: 'INR (₹)', label: 'Indian Rupee (₹)' },
  { code: '$', name: 'USD ($)', label: 'US Dollar ($)' },
  { code: '€', name: 'EUR (€)', label: 'Euro (€)' },
  { code: '£', name: 'GBP (£)', label: 'British Pound (£)' },
  { code: '¥', name: 'JPY (¥)', label: 'Japanese Yen (¥)' },
  { code: 'C$', name: 'CAD (C$)', label: 'Canadian Dollar (C$)' },
  { code: 'A$', name: 'AUD (A$)', label: 'Australian Dollar (A$)' },
  { code: 'AED', name: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'SGD', name: 'SGD (S$)', label: 'Singapore Dollar (S$)' },
];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getCategoryMeta(categoryName: string): CategoryMeta {
  const match = STANDARD_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.id.toLowerCase() === categoryName.toLowerCase()
  );
  if (match) return match;

  // Hash-based dynamic color for custom categories
  const colors = ['#0ea5e9', '#14b8a6', '#f97316', '#a855f7', '#e11d48', '#84cc16'];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  return {
    id: categoryName,
    name: categoryName,
    color,
    bgColor: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800/40',
    textColor: 'text-brand-500',
    icon: 'Tag',
  };
}
