import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CURRENCIES } from '../../lib/constants';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Mail, Lock, User as UserIcon, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, signUpWithEmail, enableDemoMode } = useAuth();
  const { addToast } = useExpenses();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccessUnverified, setSignupSuccessUnverified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === 'signin') {
      const { error } = await signInWithEmail(email, password);
      setIsLoading(false);
      if (error) {
        setError(error.message);
      } else {
        addToast({
          type: 'success',
          title: 'Welcome Back!',
          message: 'You have logged in successfully.',
        });
        onClose();
      }
    } else {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        setIsLoading(false);
        return;
      }

      const { error, unverified } = await signUpWithEmail(email, password, fullName, currency);
      setIsLoading(false);
      if (error) {
        setError(error.message);
      } else if (unverified) {
        setSignupSuccessUnverified(true);
        addToast({
          type: 'info',
          title: 'Verification Link Sent',
          message: 'Please check your email inbox to verify your account.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Account Created',
          message: 'Your account is ready to track expenses.',
        });
        onClose();
      }
    }
  };

  const handleDemoLogin = () => {
    enableDemoMode();
    addToast({
      type: 'info',
      title: 'Interactive Demo Mode',
      message: 'Logged in as Demo User with sample expenses & budgets.',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        signupSuccessUnverified
          ? 'Verify Your Email'
          : mode === 'signin'
          ? 'Sign in to ExpenseTracker'
          : 'Create Your Account'
      }
      subtitle={
        signupSuccessUnverified
          ? 'We have sent a confirmation link to your inbox.'
          : mode === 'signin'
          ? 'Access your transactions, smart budgets & domain analytics'
          : 'Start taking control of your personal finances today'
      }
      maxWidth="md"
    >
      {signupSuccessUnverified ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-surface-900 dark:text-surface-100">Check Your Inbox</h4>
            <p className="text-sm text-surface-600 dark:text-surface-300 max-w-sm mx-auto">
              We sent a verification link to <span className="font-semibold text-brand-600">{email}</span>.
              Click the link to verify your account and complete registration.
            </p>
          </div>
          <div className="pt-2">
            <Button
              className="w-full"
              onClick={() => {
                setSignupSuccessUnverified(false);
                setMode('signin');
              }}
            >
              Return to Sign In
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <Input
                label="Full Name"
                placeholder="e.g. Sarah Connor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                  Preferred Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/80 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            minLength={6}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          {/* Quick Demo Mode fallback / testing */}
          <div className="pt-3 border-t border-surface-100 dark:border-surface-800">
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40"
              onClick={handleDemoLogin}
              leftIcon={<Sparkles className="w-4 h-4 text-brand-500" />}
            >
              Continue in Instant Demo Mode
            </Button>
            {!isSupabaseConfigured && (
              <p className="text-[11px] text-center text-surface-400 mt-2">
                Supabase keys not yet configured. Demo mode allows full feature testing.
              </p>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};
