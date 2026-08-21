import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CURRENCIES } from '../../lib/constants';
import { ResetPasswordModal } from './ResetPasswordModal';
import {
  Wallet,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  PieChart,
  Target,
  Sun,
  Moon,
  TrendingUp,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, enableDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
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
      }
    }
  };

  const handleDemoLogin = () => {
    enableDemoMode();
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 transition-colors">
      {/* Left Column: Hero & Product Highlights (Visible on Large Screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-800 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight">Master Tracker</span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 border border-white/30">
              Pro
            </span>
          </div>
        </div>

        {/* Center: Feature Value Props */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Smart Financial Assistant</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
              Master Your Money with Precision & Device Security
            </h1>
            <p className="text-base text-brand-100 font-normal leading-relaxed">
              Track categorized spending, establish dynamic monthly budget ceilings with color-shifting threshold alerts, and protect your finances with PIN & WebAuthn biometrics.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
              <div className="p-2 w-fit rounded-xl bg-white/20">
                <PieChart className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-sm">Domain Analytics</h4>
              <p className="text-xs text-brand-100 leading-snug">
                Side-by-side doughnut & bar charts for each expense domain.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
              <div className="p-2 w-fit rounded-xl bg-white/20">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-sm">PIN & Biometric Lock</h4>
              <p className="text-xs text-brand-100 leading-snug">
                Encrypted 4-digit PIN fallback and native WebAuthn Face/Touch ID.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
              <div className="p-2 w-fit rounded-xl bg-white/20">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-sm">Proactive Alerts</h4>
              <p className="text-xs text-brand-100 leading-snug">
                Instant green-to-red warnings before you exceed your budget.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
              <div className="p-2 w-fit rounded-xl bg-white/20">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-sm">Multi-Currency</h4>
              <p className="text-xs text-brand-100 leading-snug">
                Instant currency switching in Indian Rupees (₹), USD, EUR, GBP & more.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-brand-100">
          <span>End-to-End Encrypted Session</span>
          <span>PostgreSQL + Row-Level Security</span>
        </div>
      </div>

      {/* Right Column: Auth Forms (Sign In / Sign Up) */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 max-w-xl mx-auto w-full">
        {/* Top Header Controls (Theme switch & Mobile Logo) */}
        <div className="flex items-center justify-between w-full">
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-surface-900 dark:text-surface-100 tracking-tight">
              Master<span className="text-brand-600 dark:text-brand-400">Tracker</span>
            </span>
          </div>

          <div className="ml-auto">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-surface-700" />}
            </button>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="my-auto py-8 space-y-6">
          {/* Header Title */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
              {signupSuccessUnverified
                ? 'Verify Your Email'
                : mode === 'signin'
                ? 'Welcome Back'
                : 'Create an Account'}
            </h2>
            <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
              {signupSuccessUnverified
                ? 'A confirmation link has been dispatched to your email address.'
                : mode === 'signin'
                ? 'Sign in to access your ledger, security locks, and financial insights.'
                : 'Get started in seconds. No complicated setup required.'}
            </p>
          </div>

          {/* Verification Screen State */}
          {signupSuccessUnverified ? (
            <div className="p-6 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
                  Confirmation Email Sent
                </h3>
                <p className="text-xs text-surface-600 dark:text-surface-300">
                  We sent an email to <span className="font-semibold text-brand-600 dark:text-brand-400">{email}</span>. Click the link in the message to activate your account.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSignupSuccessUnverified(false);
                  setMode('signin');
                }}
                className="text-xs"
              >
                Return to Sign In
              </Button>
            </div>
          ) : (
            <>
              {/* Sign In / Sign Up Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                      : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
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
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-300 shadow-sm'
                      : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {error}
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      leftIcon={<UserIcon className="w-4 h-4 text-surface-400" />}
                      required
                    />

                    {/* Preferred Currency Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                        Default Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-surface-400" />}
                  required
                />

                <div className="space-y-1">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4 text-surface-400" />}
                    required
                    helperText={mode === 'signup' ? 'Must be at least 6 characters' : undefined}
                  />

                  {mode === 'signin' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20"
                >
                  {mode === 'signin' ? 'Sign In to Dashboard' : 'Create My Account'}
                </Button>
              </form>

              {/* Demo Mode Instant Access Divider */}
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200 dark:border-surface-700/60" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-surface-50 dark:bg-surface-950 px-3 text-surface-400 font-semibold">
                    Or instant preview
                  </span>
                </div>
              </div>

              {/* Demo Mode Button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700/80 hover:border-brand-500/40 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all text-left group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-surface-900 dark:text-surface-100">
                      Explore in Demo Mode
                    </h4>
                    <p className="text-[11px] text-surface-500 dark:text-surface-400">
                      Pre-populated with mock expenses, budgets & PIN lock
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 text-center text-xs text-surface-400">
          Master Tracker • Personal Finance & Security Suite
        </div>
      </div>

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
