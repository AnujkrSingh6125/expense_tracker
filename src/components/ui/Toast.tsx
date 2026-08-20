import React from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useExpenses();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let borderClass = 'border-brand-500/30';
        let bgClass = 'bg-surface-900/90 text-white';
        let icon = <Info className="w-5 h-5 text-brand-400 shrink-0" />;

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/50 bg-amber-950/90 text-amber-100';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />;
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/50 bg-rose-950/90 text-rose-100';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up',
              bgClass,
              borderClass
            )}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>
              <p className="text-xs mt-1 opacity-90 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
