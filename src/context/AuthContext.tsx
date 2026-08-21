import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';
import { clearAllLocalData } from '../lib/db';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  isDemoMode: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, currency?: string) => Promise<{ error: AuthError | Error | null; unverified?: boolean }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  resetPasswordEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (val: boolean) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PROFILE_STORAGE_KEY = 'et_demo_profile';

const DEFAULT_DEMO_PROFILE: Profile = {
  id: 'demo-user-12345',
  email: 'demo@expensetracker.app',
  full_name: 'Alex Johnson',
  currency: '₹',
  pin_hash: null,
  biometric_enabled: false,
  biometric_credential_id: null,
  custom_domain: 'alex-workspace',
  custom_domains: ['Personal', 'Business', 'Freelance', 'Side-Hustle', 'Household', 'Travel/Trip'],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    return window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token');
  });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('et_demo_active') === 'true';
  });

  const fetchProfile = useCallback(async (userId: string, userEmail: string) => {
    if (!isSupabaseConfigured || isDemoMode) return;
    try {
      const localSavedCurrency = localStorage.getItem('et_user_currency');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet, insert fallback with user's chosen currency
          const chosenCurrency = localSavedCurrency || '₹';
          const newProfile: Profile = {
            id: userId,
            email: userEmail,
            full_name: userEmail.split('@')[0],
            currency: chosenCurrency,
            pin_hash: null,
            biometric_enabled: false,
            biometric_credential_id: null,
            custom_domain: null,
            custom_domains: ['Personal', 'Business', 'Freelance', 'Side-Hustle', 'Household', 'Travel/Trip'],
          };
          await supabase.from('profiles').insert(newProfile);
          setProfile(newProfile);
          return;
        }
        console.error('Error fetching profile:', error);
      } else if (data) {
        const profileData = data as Profile;
        // If user changed currency locally, or if existing profile had $ fallback, sync to preferred currency
        if (localSavedCurrency && profileData.currency !== localSavedCurrency) {
          profileData.currency = localSavedCurrency;
          supabase
            .from('profiles')
            .update({ currency: localSavedCurrency, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .then(() => {});
        } else if (!profileData.currency || profileData.currency === '$') {
          profileData.currency = '₹';
          supabase
            .from('profiles')
            .update({ currency: '₹', updated_at: new Date().toISOString() })
            .eq('id', userId)
            .then(() => {});
        }
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [isDemoMode]);

  // Load initial demo profile or Supabase session
  useEffect(() => {
    if (isDemoMode) {
      const savedDemo = localStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          if (!parsed.currency || parsed.currency === '$') {
            parsed.currency = '₹';
            localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(parsed));
          }
          setProfile(parsed);
        } catch {
          setProfile(DEFAULT_DEMO_PROFILE);
        }
      } else {
        setProfile(DEFAULT_DEMO_PROFILE);
      }
      setUser({
        id: 'demo-user-12345',
        email: 'demo@expensetracker.app',
        app_metadata: {},
        user_metadata: { full_name: 'Alex Johnson' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
      } as unknown as User);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Supabase auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemoMode, fetchProfile]);

  const isEmailVerified: boolean = Boolean(
    isDemoMode ||
    (user && (user.email_confirmed_at || (user as unknown as { confirmed_at?: string }).confirmed_at))
  );

  const signInWithEmail = async (email: string, password: string) => {
    if (isDemoMode || !isSupabaseConfigured) {
      // Demo login
      setIsDemoMode(true);
      localStorage.setItem('et_demo_active', 'true');
      setProfile((prev) => prev || DEFAULT_DEMO_PROFILE);
      setUser({
        id: 'demo-user-12345',
        email,
        app_metadata: {},
        user_metadata: { full_name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
      } as unknown as User);
      return { error: null };
    }

    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) return { error: res.error };
    if (res.data.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      await fetchProfile(res.data.user.id, res.data.user.email || '');
    }
    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, currency: string = '₹') => {
    localStorage.setItem('et_user_currency', currency);
    if (!isSupabaseConfigured) {
      // Fallback demo signup
      setIsDemoMode(true);
      localStorage.setItem('et_demo_active', 'true');
      const newProf: Profile = {
        id: 'demo-user-12345',
        email,
        full_name: fullName,
        currency,
        pin_hash: null,
        biometric_enabled: false,
        biometric_credential_id: null,
      };
      setProfile(newProf);
      localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(newProf));
      return { error: null, unverified: false };
    }

    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          currency,
        },
      },
    });

    if (res.error) return { error: res.error };

    // Check if email confirmation is required
    const unverified = !res.data.user?.email_confirmed_at && !res.data.session;
    return { error: null, unverified };
  };

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem('et_demo_active');
      setIsDemoMode(false);
      setUser(null);
      setProfile(null);
      return;
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resendVerificationEmail = async (email: string) => {
    if (!isSupabaseConfigured) return { error: null };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error };
  };

  const resetPasswordEmail = async (email: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const updatePassword = async (password: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsPasswordRecovery(false);
      // Clean URL hash
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (updates.currency) {
      localStorage.setItem('et_user_currency', updates.currency);
    }

    // Always update local state immediately
    setProfile((prev) => {
      if (prev) return { ...prev, ...updates };
      return {
        id: user?.id || 'demo-user-12345',
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || '',
        currency: updates.currency || '₹',
        pin_hash: null,
        biometric_enabled: false,
        biometric_credential_id: null,
        ...updates,
      };
    });

    if (isDemoMode) {
      const updated = {
        ...(profile || DEFAULT_DEMO_PROFILE),
        ...updates,
      } as Profile;
      localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(updated));
      return { error: null };
    }

    if (!user || !isSupabaseConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email || '',
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) throw error;
      return { error: null };
    } catch (err: unknown) {
      console.error('Failed to update profile in Supabase:', err);
      return { error: err as Error };
    }
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('et_demo_active', 'true');
    setProfile(DEFAULT_DEMO_PROFILE);
    setUser({
      id: 'demo-user-12345',
      email: 'demo@expensetracker.app',
      app_metadata: {},
      user_metadata: { full_name: 'Alex Johnson' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
    } as unknown as User);
  };

  const deleteAccount = async (): Promise<{ error: Error | null }> => {
    try {
      if (isDemoMode || !isSupabaseConfigured) {
        localStorage.removeItem('et_demo_active');
        localStorage.removeItem(DEMO_PROFILE_STORAGE_KEY);
        localStorage.removeItem('et_demo_expenses');
        localStorage.removeItem('et_demo_budgets');
        localStorage.removeItem('et_user_currency');
        localStorage.removeItem('et_sec_pin_hash');
        localStorage.removeItem('et_sec_bio_enabled');
        localStorage.removeItem('et_sec_bio_cred_id');
        setIsDemoMode(false);
        setUser(null);
        setProfile(null);
        return { error: null };
      }

      if (user) {
        const userId = user.id;

        // 1. Call server-side PostgreSQL function to delete from auth.users (cascades to all tables)
        const { error: rpcError } = await supabase.rpc('delete_user', {
          target_user_id: userId,
        });

        if (rpcError) {
          console.warn('delete_user RPC notice, performing fallback deletions:', rpcError);
          // Fallback: Delete all user records manually
          try {
            await supabase.from('group_expense_splits').delete().eq('user_id', userId);
            await supabase.from('group_expenses').delete().eq('paid_by', userId);
            await supabase.from('group_members').delete().eq('user_id', userId);
            await supabase.from('expenses').delete().eq('user_id', userId);
            await supabase.from('budgets').delete().eq('user_id', userId);
            await supabase.from('profiles').delete().eq('id', userId);
          } catch (delErr) {
            console.error('Fallback delete error:', delErr);
          }
        }

        // 2. Clear all local IndexedDB offline storage
        try {
          await clearAllLocalData();
        } catch (idbErr) {
          console.warn('IDB clear warning:', idbErr);
        }

        // 3. Clear local storage and session storage
        localStorage.clear();
        sessionStorage.clear();

        // 4. Sign out of Supabase
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsDemoMode(false);
      }
      return { error: null };
    } catch (err: unknown) {
      console.error('Error during account deletion:', err);
      return { error: err as Error };
    }
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem('et_demo_active');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isEmailVerified,
        isDemoMode,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resendVerificationEmail,
        resetPasswordEmail,
        updatePassword,
        isPasswordRecovery,
        setIsPasswordRecovery,
        updateProfile,
        deleteAccount,
        enableDemoMode,
        disableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
