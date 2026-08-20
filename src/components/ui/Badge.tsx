import React from 'react';
import { cn } from '../../lib/utils';
import { getCategoryMeta } from '../../lib/constants';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  category?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  category,
  className,
}) => {
  if (category) {
    const meta = getCategoryMeta(category);
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors',
          meta.bgColor,
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
        {children || meta.name}
      </span>
    );
  }

  const variants: Record<'default' | 'success' | 'warning' | 'danger' | 'info', string> = {
    default: 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
    info: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800/40',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
