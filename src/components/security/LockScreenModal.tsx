import React, { useState, useEffect, useCallback } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { Lock, Fingerprint, Delete, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const LockScreenModal: React.FC = () => {
  const {
    isLocked,
    hasBiometrics,
    unlockWithPin,
    unlockWithBiometrics,
    resetPinWithPassword,
    resetPinDirect,
  } = useSecurity();
  const { profile, isDemoMode } = useAuth();
  const { addToast } = useExpenses();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Forgot MPIN Reset Sub-mode
  const [isResettingPin, setIsResettingPin] = useState<boolean>(false);
  const [accountPassword, setAccountPassword] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResettingLoading, setIsResettingLoading] = useState<boolean>(false);

  // Auto trigger biometrics on lock screen mount if configured
  useEffect(() => {
    if (isLocked && hasBiometrics && !isResettingPin) {
      handleBiometricUnlock();
    }
  }, [isLocked, hasBiometrics, isResettingPin]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (isResettingPin) return;
      if (pin.length < 4) {
        setError(null);
        const nextPin = pin + digit;
        setPin(nextPin);
        if (nextPin.length === 4) {
          triggerPinVerification(nextPin);
        }
      }
    },
    [pin, isResettingPin]
  );

  const handleDelete = useCallback(() => {
    if (isResettingPin) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isResettingPin]);

  const handleClear = useCallback(() => {
    if (isResettingPin) return;
    setError(null);
    setPin('');
  }, [isResettingPin]);

  const triggerPinVerification = async (enteredPin: string) => {
    setIsVerifying(true);
    const result = await unlockWithPin(enteredPin);
    setIsVerifying(false);

    if (!result.success) {
      setError(result.error || 'Incorrect PIN code');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    } else {
      setPin('');
      setError(null);
    }
  };

  const handleBiometricUnlock = async () => {
    setIsVerifying(true);
    setError(null);
    const result = await unlockWithBiometrics();
    setIsVerifying(false);
    if (!result.success && result.error && !result.error.includes('cancelled')) {
      setError(result.error);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setResetError('New PIN must be exactly 4 numeric digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setResetError('New PIN codes do not match.');
      return;
    }

    setResetError(null);
    setIsResettingLoading(true);

    if (isDemoMode) {
      const res = await resetPinDirect(newPin);
      setIsResettingLoading(false);
      if (res.success) {
        setIsResettingPin(false);
        addToast({
          type: 'success',
          title: 'PIN Reset Successfully',
          message: 'Your new 4-digit PIN is active and the app is unlocked.',
        });
      } else {
        setResetError(res.error || 'Failed to reset PIN.');
      }
    } else {
      if (!accountPassword) {
        setResetError('Please enter your account password.');
        setIsResettingLoading(false);
        return;
      }
      const res = await resetPinWithPassword(accountPassword, newPin);
      setIsResettingLoading(false);
      if (res.success) {
        setIsResettingPin(false);
        setAccountPassword('');
        setNewPin('');
        setConfirmNewPin('');
        addToast({
          type: 'success',
          title: 'PIN Reset Successfully',
          message: 'Your new 4-digit PIN is active and the app is unlocked.',
        });
      } else {
        setResetError(res.error || 'Password verification failed.');
      }
    }
  };

  // Keyboard input listener
  useEffect(() => {
    if (!isLocked || isResettingPin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, isResettingPin, handleDigit, handleDelete, handleClear]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/80 backdrop-blur-xl p-4 selection:bg-transparent animate-fade-in">
      <div
        className={`w-full max-w-sm bg-white dark:bg-surface-900 rounded-3xl p-8 border border-surface-200 dark:border-surface-800 shadow-2xl flex flex-col items-center text-center transition-all ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {isResettingPin ? (
          /* Forgot MPIN Reset Form */
          <div className="w-full space-y-4 text-left">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-surface-900 dark:text-surface-100">
                Reset 4-Digit MPIN
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {isDemoMode
                  ? 'Set a new 4-digit PIN for your session.'
                  : 'Verify your account password to securely set a new MPIN.'}
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPinSubmit} className="space-y-3">
              {!isDemoMode && (
                <Input
                  label="Account Password *"
                  type="password"
                  placeholder="Enter your account password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  required
                />
              )}

              <Input
                label="New 4-Digit PIN *"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                required
                className="text-center font-mono tracking-widest text-lg"
              />

              <Input
                label="Confirm New 4-Digit PIN *"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                required
                className="text-center font-mono tracking-widest text-lg"
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setIsResettingPin(false);
                    setResetError(null);
                  }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isResettingLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-700"
                >
                  Save & Unlock
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* Standard MPIN Keypad */
          <>
            {/* Top Lock Icon */}
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 ring-8 ring-brand-500/5">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              ExpenseTracker Locked
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 mb-6">
              {profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Enter your 4-digit PIN to continue'}
            </p>

            {/* PIN Indicator Dots */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-brand-600 scale-110 shadow-md shadow-brand-500/30'
                        : 'bg-surface-200 dark:bg-surface-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mb-4 animate-shake">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 3x4 Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  disabled={isVerifying}
                  className="h-14 rounded-2xl bg-surface-100 dark:bg-surface-800/80 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100 text-xl font-semibold active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                >
                  {digit}
                </button>
              ))}

              {/* Bottom Row */}
              {hasBiometrics ? (
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  disabled={isVerifying}
                  title="Biometric Unlock"
                  className="h-14 rounded-2xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 active:scale-95 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                >
                  <Fingerprint className="w-6 h-6" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-14 rounded-2xl text-xs font-semibold text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 active:scale-95 transition-all focus:outline-none"
                >
                  CLEAR
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDigit('0')}
                disabled={isVerifying}
                className="h-14 rounded-2xl bg-surface-100 dark:bg-surface-800/80 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100 text-xl font-semibold active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isVerifying || pin.length === 0}
                title="Delete"
                className="h-14 rounded-2xl bg-surface-100 dark:bg-surface-800/80 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 active:scale-95 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-30"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Forgot MPIN Option */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsResettingPin(true);
                  setResetError(null);
                }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
              >
                Forgot MPIN?
              </button>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-surface-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Device Protected with Hardware/Cryptographic Security</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
