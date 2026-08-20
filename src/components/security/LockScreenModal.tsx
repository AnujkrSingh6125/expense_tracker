import React, { useState, useEffect, useCallback } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { useAuth } from '../../context/AuthContext';
import { Lock, Fingerprint, Delete, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const LockScreenModal: React.FC = () => {
  const { isLocked, hasBiometrics, unlockWithPin, unlockWithBiometrics } = useSecurity();
  const { profile } = useAuth();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Auto trigger biometrics on lock screen mount if configured
  useEffect(() => {
    if (isLocked && hasBiometrics) {
      handleBiometricUnlock();
    }
  }, [isLocked, hasBiometrics]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length < 4) {
        setError(null);
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          triggerPinVerification(newPin);
        }
      }
    },
    [pin]
  );

  const handleDelete = useCallback(() => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setError(null);
    setPin('');
  }, []);

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

  // Keyboard input listener
  useEffect(() => {
    if (!isLocked) return;

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
  }, [isLocked, handleDigit, handleDelete, handleClear]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/80 backdrop-blur-xl p-4 selection:bg-transparent animate-fade-in">
      <div
        className={`w-full max-w-sm bg-white dark:bg-surface-900 rounded-3xl p-8 border border-surface-200 dark:border-surface-800 shadow-2xl flex flex-col items-center text-center transition-all ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
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
                    ? 'bg-brand-600 dark:bg-brand-400 scale-110 shadow-md shadow-brand-500/30'
                    : 'border-2 border-surface-300 dark:border-surface-700 bg-surface-100 dark:bg-surface-800'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium mb-4 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit.toString())}
              disabled={isVerifying}
              className="h-14 rounded-2xl bg-surface-100 dark:bg-surface-800/80 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100 text-xl font-semibold active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Biometrics / Clear, 0, Backspace */}
          {hasBiometrics ? (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isVerifying}
              title="Unlock with Biometrics"
              className="h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 active:scale-95 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
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

        {/* WebAuthn Biometric Trigger Link */}
        {hasBiometrics && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBiometricUnlock}
            isLoading={isVerifying}
            leftIcon={<Fingerprint className="w-4 h-4 text-brand-500" />}
            className="text-xs text-brand-600 dark:text-brand-400 mt-2"
          >
            Use Fingerprint / Face ID
          </Button>
        )}

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-surface-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Device Protected with Hardware/Cryptographic Security</span>
        </div>
      </div>
    </div>
  );
};
