import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card / Bottom Sheet Container */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-surface-200 dark:border-surface-800 overflow-hidden z-10 my-0 sm:my-8 transition-all transform animate-slide-up max-h-[92vh] sm:max-h-[85vh] flex flex-col',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Mobile Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-surface-300 dark:bg-surface-700 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100">{title}</h3>
            {subtitle && <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with bottom safe area support */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
};
