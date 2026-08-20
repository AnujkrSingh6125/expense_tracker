import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { useExpenses } from '../../context/ExpenseContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { KeyRound, Fingerprint, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    hasPin,
    hasBiometrics,
    setupPin,
    removePin,
    setupBiometrics,
    disableBiometrics,
  } = useSecurity();
  const { addToast } = useExpenses();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isEnrollingBio, setIsEnrollingBio] = useState(false);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError('PIN must be exactly 4 digits (0-9).');
      return;
    }

    if (pin !== confirmPin) {
      setPinError('PIN codes do not match.');
      return;
    }

    setIsSavingPin(true);
    const result = await setupPin(pin);
    setIsSavingPin(false);

    if (result.success) {
      addToast({
        type: 'success',
        title: 'PIN Configured',
        message: 'Your 4-digit app lock PIN is now active.',
      });
      setPin('');
      setConfirmPin('');
    } else {
      setPinError(result.error || 'Failed to save PIN.');
    }
  };

  const handleRemovePin = async () => {
    if (!confirm('Are you sure you want to remove your lock PIN?')) return;
    const res = await removePin();
    if (res.success) {
      addToast({
        type: 'info',
        title: 'PIN Removed',
        message: 'Your app lock PIN has been disabled.',
      });
    }
  };

  const handleToggleBiometrics = async () => {
    if (hasBiometrics) {
      const res = await disableBiometrics();
      if (res.success) {
        addToast({
          type: 'info',
          title: 'Biometrics Disabled',
          message: 'Biometric lock has been removed from this device.',
        });
      }
    } else {
      setIsEnrollingBio(true);
      const res = await setupBiometrics();
      setIsEnrollingBio(false);

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Biometrics Configured',
          message: 'WebAuthn passkey registered. You can now unlock with Touch ID/Face ID/Windows Hello.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Enrollment Failed',
          message: res.error || 'Could not register biometric passkey.',
        });
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Device Security & App Lock"
      subtitle="Protect your financial dashboard with a 4-digit PIN and WebAuthn biometrics."
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Section 1: 4-digit PIN */}
        <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/60 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-surface-900 dark:text-surface-100">
                  4-Digit Numeric PIN
                </h4>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {hasPin ? 'PIN lock is currently ACTIVE' : 'Configure a PIN for rapid unlocking'}
                </p>
              </div>
            </div>
            {hasPin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePin}
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Remove
              </Button>
            )}
          </div>

          <form onSubmit={handleSavePin} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={hasPin ? 'New 4-Digit PIN' : 'Enter 4-Digit PIN'}
                type="password"
                maxLength={4}
                placeholder="••••"
                pattern="[0-9]{4}"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
              />
              <Input
                label="Confirm PIN"
                type="password"
                maxLength={4}
                placeholder="••••"
                pattern="[0-9]{4}"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
              />
            </div>

            {pinError && <p className="text-xs text-rose-500 font-medium">{pinError}</p>}

            <Button
              type="submit"
              size="sm"
              isLoading={isSavingPin}
              className="w-full"
              disabled={pin.length !== 4 || confirmPin.length !== 4}
            >
              {hasPin ? 'Update PIN Code' : 'Enable 4-Digit PIN'}
            </Button>
          </form>
        </div>

        {/* Section 2: WebAuthn Biometrics */}
        <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-surface-900 dark:text-surface-100 flex items-center gap-2">
                Biometrics (WebAuthn)
                {hasBiometrics && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Enabled
                  </span>
                )}
              </h4>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Unlock via Face ID, Touch ID, or Windows Hello platform authenticator.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant={hasBiometrics ? 'outline' : 'primary'}
            isLoading={isEnrollingBio}
            onClick={handleToggleBiometrics}
            className="shrink-0 text-xs"
          >
            {hasBiometrics ? 'Disable' : 'Enroll Passkey'}
          </Button>
        </div>

        {/* Auto-Lock Info */}
        <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/20 flex items-start gap-2.5 text-xs text-brand-900 dark:text-brand-200">
          <ShieldAlert className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            When PIN or Biometrics are enabled, the app automatically locks on page reload, when
            clicking the lock icon, or after <strong>5 minutes of inactivity</strong>.
          </p>
        </div>
      </div>
    </Modal>
  );
};
