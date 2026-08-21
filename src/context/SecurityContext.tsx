import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hashPin, verifyPin } from '../lib/crypto';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerBiometricPasskey,
  verifyBiometricPasskey,
} from '../lib/webauthn';

interface SecurityContextType {
  isLocked: boolean;
  hasPin: boolean;
  hasBiometrics: boolean;
  isBiometricsSupported: boolean;
  lockApp: () => void;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  setupPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  removePin: () => Promise<{ success: boolean; error?: string }>;
  resetPinWithPassword: (password: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  resetPinDirect: (newPin: string) => Promise<{ success: boolean; error?: string }>;
  setupBiometrics: () => Promise<{ success: boolean; error?: string }>;
  disableBiometrics: () => Promise<{ success: boolean; error?: string }>;
  hasSecurityConfigured: boolean;
}

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, updateProfile, user } = useAuth();
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isBiometricsSupported, setIsBiometricsSupported] = useState<boolean>(false);

  const hasPin = Boolean(profile?.pin_hash);
  const hasBiometrics = Boolean(profile?.biometric_enabled && profile?.biometric_credential_id);
  const hasSecurityConfigured = hasPin || hasBiometrics;

  const inactivityTimerRef = useRef<number | null>(null);

  // Check WebAuthn support on mount
  useEffect(() => {
    async function checkSupport() {
      const supported = isWebAuthnSupported();
      const platformAvail = await isPlatformAuthenticatorAvailable();
      setIsBiometricsSupported(supported && platformAvail);
    }
    checkSupport();
  }, []);

  // Lock on initial load if security is configured
  useEffect(() => {
    if (hasSecurityConfigured) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, [hasSecurityConfigured]);

  const lockApp = useCallback(() => {
    if (hasSecurityConfigured) {
      setIsLocked(true);
    }
  }, [hasSecurityConfigured]);

  // Inactivity detection (5 minutes)
  useEffect(() => {
    if (!hasSecurityConfigured || isLocked) {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    resetTimer();

    return () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [hasSecurityConfigured, isLocked]);

  const unlockWithPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.pin_hash) {
      setIsLocked(false);
      return { success: true };
    }

    const isValid = await verifyPin(pin, profile.pin_hash);
    if (isValid) {
      setIsLocked(false);
      return { success: true };
    }
    return { success: false, error: 'Incorrect PIN. Please try again.' };
  };

  const unlockWithBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.biometric_credential_id) {
      return { success: false, error: 'Biometrics are not configured on this device.' };
    }

    try {
      const verified = await verifyBiometricPasskey(profile.biometric_credential_id);
      if (verified) {
        setIsLocked(false);
        return { success: true };
      }
      return { success: false, error: 'Biometric verification failed.' };
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Biometric authentication was cancelled or failed.';
      return { success: false, error: errorMsg };
    }
  };

  const setupPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, error: 'PIN must be exactly 4 digits.' };
    }

    try {
      const hashed = await hashPin(pin);
      const res = await updateProfile({ pin_hash: hashed });
      if (res.error) throw res.error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to save PIN.' };
    }
  };

  const removePin = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await updateProfile({ pin_hash: null });
      if (res.error) throw res.error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to remove PIN.' };
    }
  };

  const resetPinWithPassword = async (
    password: string,
    newPin: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return { success: false, error: 'New PIN must be exactly 4 digits.' };
    }

    try {
      // In Supabase mode, verify user password
      if (user && user.email && isSupabaseConfigured) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password,
        });
        if (signInErr) {
          return { success: false, error: 'Incorrect account password. Verification failed.' };
        }
      }

      const hashed = await hashPin(newPin);
      const res = await updateProfile({ pin_hash: hashed });
      if (res.error) throw res.error;
      setIsLocked(false);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to reset PIN.' };
    }
  };

  const resetPinDirect = async (newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return { success: false, error: 'New PIN must be exactly 4 digits.' };
    }
    try {
      const hashed = await hashPin(newPin);
      const res = await updateProfile({ pin_hash: hashed });
      if (res.error) throw res.error;
      setIsLocked(false);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to reset PIN.' };
    }
  };

  const setupBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User is not authenticated.' };
    }

    try {
      const result = await registerBiometricPasskey(user.email || 'user@expensetracker.app', user.id);
      const res = await updateProfile({
        biometric_enabled: true,
        biometric_credential_id: result.credentialId,
      });

      if (res.error) throw res.error;
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to register biometric credential.';
      return { success: false, error: msg };
    }
  };

  const disableBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await updateProfile({
        biometric_enabled: false,
        biometric_credential_id: null,
      });
      if (res.error) throw res.error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Failed to disable biometrics.' };
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        hasPin,
        hasBiometrics,
        isBiometricsSupported,
        lockApp,
        unlockWithPin,
        unlockWithBiometrics,
        setupPin,
        removePin,
        resetPinWithPassword,
        resetPinDirect,
        setupBiometrics,
        disableBiometrics,
        hasSecurityConfigured,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
