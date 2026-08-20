import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/80 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:bg-surface-50 dark:disabled:bg-surface-900',
              leftIcon && 'pl-10',
              rightElement && 'pr-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightElement}</div>
          )}
        </div>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-surface-500 dark:text-surface-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
