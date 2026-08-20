import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 focus:ring-brand-500 border border-transparent',
    secondary:
      'bg-surface-100 hover:bg-surface-200 text-surface-800 dark:bg-surface-800 dark:hover:bg-surface-700 dark:text-surface-100 focus:ring-surface-400 border border-transparent',
    outline:
      'border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200 focus:ring-brand-500',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 focus:ring-rose-500 border border-transparent',
    ghost:
      'bg-transparent hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 focus:ring-brand-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
