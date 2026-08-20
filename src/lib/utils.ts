import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  
  const locale = currency === '₹' ? 'en-IN' : 'en-US';
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: absVal % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(absVal);

  return `${isNegative ? '-' : ''}${currency}${formattedNumber}`;
}

export function formatDate(dateString: string, formatStr: string = 'MMM dd, yyyy'): string {
  if (!dateString) return '';
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) {
      return dateString;
    }
    return format(parsed, formatStr);
  } catch {
    return dateString;
  }
}

export function formatPercentage(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
