import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Mail, Lock, CheckCircle2 } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'request_email' | 'set_new_password';
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'request_email',
}) => {
  const { resetPasswordEmail, updatePassword, isPasswordRecovery, setIsPasswordRecovery } = useAuth();
  const { addToast } = useExpenses();

  const mode = isPasswordRecovery ? 'set_new_password' : initialMode;
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleRequestResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const { error: resetErr } = await resetPasswordEmail(email.trim());
    setIsLoading(false);

    if (resetErr) {
      setError(resetErr.message || 'Failed to send reset email.');
    } else {
      setEmailSent(true);
      addToast({
        type: 'success',
        title: 'Recovery Email Sent',
        message: 'Check your inbox for the password reset link.',
      });
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const { error: updateErr } = await updatePassword(newPassword);
    setIsLoading(false);

    if (updateErr) {
      setError(updateErr.message || 'Failed to update password.');
    } else {
      setIsPasswordRecovery(false);
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your new password is set. You are now logged in.',
      });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'set_new_password' || isPasswordRecovery
          ? 'Set New Password'
          : emailSent
          ? 'Check Your Inbox'
          : 'Reset Your Password'
      }
      subtitle={
        mode === 'set_new_password' || isPasswordRecovery
          ? 'Enter and confirm your new secure account password.'
          : emailSent
          ? 'A secure password recovery link has been dispatched to your email.'
          : 'Enter your registered email address to receive recovery instructions.'
      }
    >
      {mode === 'set_new_password' || isPasswordRecovery ? (
        <form onSubmit={handleSetNewPassword} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          <Input
            label="New Password *"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-surface-400" />}
            required
            helperText="Must be at least 6 characters"
          />

          <Input
            label="Confirm New Password *"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-surface-400" />}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1 bg-brand-600 hover:bg-brand-700">
              Save New Password
            </Button>
          </div>
        </form>
      ) : emailSent ? (
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-base text-surface-900 dark:text-surface-100">
              Reset Link Sent
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              We sent a secure link to <strong className="text-brand-600 dark:text-brand-400">{email}</strong>. Open the email to set your new password.
            </p>
          </div>
          <Button
            type="button"
            className="w-full bg-brand-600 hover:bg-brand-700"
            onClick={() => {
              setEmailSent(false);
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleRequestResetEmail} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          <Input
            label="Registered Email Address *"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-surface-400" />}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1 bg-brand-600 hover:bg-brand-700">
              Send Reset Link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
