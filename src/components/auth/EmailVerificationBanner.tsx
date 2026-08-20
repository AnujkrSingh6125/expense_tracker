import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { AlertTriangle, Mail } from 'lucide-react';
import { Button } from '../ui/Button';

export const EmailVerificationBanner: React.FC = () => {
  const { user, isEmailVerified, resendVerificationEmail, isDemoMode } = useAuth();
  const { addToast } = useExpenses();
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (isEmailVerified || isDemoMode || !user) return null;

  const handleResend = async () => {
    if (!user.email || cooldown > 0) return;
    setIsSending(true);
    const { error } = await resendVerificationEmail(user.email);
    setIsSending(false);

    if (error) {
      addToast({
        type: 'error',
        title: 'Resend Failed',
        message: error.message || 'Could not send verification email.',
      });
    } else {
      addToast({
        type: 'success',
        title: 'Verification Sent',
        message: `A new confirmation link has been sent to ${user.email}.`,
      });
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-amber-900 dark:text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
          <span>
            <strong>Email verification required:</strong> Please confirm your email address (
            <span className="font-mono underline">{user.email}</span>) to unlock all sync features.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResend}
          isLoading={isSending}
          disabled={cooldown > 0}
          leftIcon={<Mail className="w-3.5 h-3.5" />}
          className="border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shrink-0"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
        </Button>
      </div>
    </div>
  );
};
