import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSecurity } from '../../context/SecurityContext';
import { useExpenses } from '../../context/ExpenseContext';
import { useTheme } from '../../context/ThemeContext';
import { exportExpensesToCSV, exportExpensesToJSON } from '../../lib/exportUtils';
import { CURRENCIES } from '../../lib/constants';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  User,
  Shield,
  KeyRound,
  Fingerprint,
  Download,
  Trash2,
  Database,
  Moon,
  Sun,
  CheckCircle2,
  AlertOctagon,
  X,
  AlertTriangle,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenSecuritySettings: () => void;
  onOpenAuthModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenSecuritySettings,
}) => {
  const { user, profile, updateProfile, deleteAccount, isDemoMode } =
    useAuth();
  const { hasPin, hasBiometrics } = useSecurity();
  const { expenses, addToast } = useExpenses();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [currency, setCurrency] = useState(profile?.currency || '₹');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (profile?.full_name !== undefined) setFullName(profile.full_name || '');
    if (profile?.currency !== undefined) setCurrency(profile.currency || '₹');
  }, [profile]);

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    const { error } = await updateProfile({ currency: newCurrency });
    if (error) {
      addToast({
        type: 'error',
        title: 'Currency Update Failed',
        message: error.message || 'Could not update currency.',
      });
    } else {
      addToast({
        type: 'success',
        title: 'Currency Updated',
        message: `Display currency switched to ${newCurrency}.`,
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      currency,
    });
    setIsSaving(false);

    if (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Could not update profile.',
      });
    } else {
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal preferences have been saved.',
      });
    }
  };

  const handleExportCSV = () => {
    exportExpensesToCSV(expenses, profile?.currency || '₹', 'all-expenses.csv');
  };

  const handleExportJSON = () => {
    exportExpensesToJSON(expenses, 'all-expenses-backup.json');
  };

  const handleClearDemoData = () => {
    if (confirm('Are you sure you want to reset all stored demo expenses and budgets?')) {
      localStorage.removeItem('et_demo_expenses');
      localStorage.removeItem('et_demo_budgets');
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      addToast({
        type: 'error',
        title: 'Confirmation Mismatch',
        message: 'Please type DELETE in capital letters to confirm account deletion.',
      });
      return;
    }

    setIsDeleting(true);
    const { error } = await deleteAccount();
    setIsDeleting(false);

    if (error) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || 'Failed to delete account. Please try again.',
      });
    } else {
      setIsDeleteDialogOpen(false);
      setDeleteConfirmText('');
      addToast({
        type: 'info',
        title: 'Account Deleted',
        message: 'Your account and all associated expense data have been permanently erased.',
        duration: 8000,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">
          Preferences & Security Settings
        </h2>
        <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
          Customize currency, profile details, device lock PIN, and biometric authentication
        </p>
      </div>

      {/* 1. Profile & Currency Preferences */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              User Profile & Default Currency
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {user ? user.email : 'Guest / Demo Mode'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Johnson"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                Display Currency
              </label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={isSaving}>
              Save Profile Preferences
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Device Security & App Lock */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
                Device Lock & Biometrics (WebAuthn)
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Protect sensitive financial records with 4-digit PIN and fingerprint/FaceID
              </p>
            </div>
          </div>

          <Button size="sm" onClick={onOpenSecuritySettings} className="text-xs">
            Manage Security
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* PIN Status card */}
          <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-brand-500" />
              <div>
                <p className="font-semibold text-xs text-surface-900 dark:text-surface-100">
                  4-Digit Quick PIN
                </p>
                <p className="text-[11px] text-surface-500">
                  {hasPin ? 'PIN is configured and active' : 'Not set up yet'}
                </p>
              </div>
            </div>
            {hasPin ? (
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Enabled
              </span>
            ) : (
              <span className="text-xs text-surface-400">Disabled</span>
            )}
          </div>

          {/* WebAuthn Status card */}
          <div className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-semibold text-xs text-surface-900 dark:text-surface-100">
                  Biometrics (WebAuthn)
                </p>
                <p className="text-[11px] text-surface-500">
                  {hasBiometrics ? 'Touch ID / Face ID / Hello active' : 'Not configured'}
                </p>
              </div>
            </div>
            {hasBiometrics ? (
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Enabled
              </span>
            ) : (
              <span className="text-xs text-surface-400">Disabled</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Theme & Appearance */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              Appearance Theme
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Currently in <span className="font-semibold capitalize">{theme}</span> Mode
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={toggleTheme}
          leftIcon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          className="text-xs"
        >
          Switch to {theme === 'dark' ? 'Light' : 'Dark'}
        </Button>
      </div>

      {/* 4. Data Backup & Export */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              Data Backup & Export
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Download your complete transaction ledger for Excel, Google Sheets, or local storage
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
            className="text-xs"
          >
            Export All to CSV ({expenses.length} Records)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportJSON}
            leftIcon={<Database className="w-4 h-4" />}
            className="text-xs"
          >
            Export Full JSON Backup
          </Button>

          {isDemoMode && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearDemoData}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              Reset Demo Data
            </Button>
          )}
        </div>
      </div>

      {/* 5. Danger Zone: Delete Account Permanently */}
      <div className="p-6 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-rose-900 dark:text-rose-200">
              Danger Zone: Account Deletion
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/80">
              Irreversible action. Permanently delete your profile, transactions, budgets, and security keys.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-rose-800 dark:text-rose-300 max-w-lg">
            Once you delete your account, there is no going back. All your expenses, budgets, PIN hashes, and biometric configurations will be permanently destroyed.
          </p>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setDeleteConfirmText('');
              setIsDeleteDialogOpen(true);
            }}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-xs whitespace-nowrap shrink-0"
          >
            Permanently Delete Account
          </Button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-surface-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-surface-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 p-6 space-y-5 z-10 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-surface-900 dark:text-surface-100">
                    Delete Account Permanently?
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
                className="p-1 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-2">
              <p className="font-bold">The following data will be permanently wiped:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>All logged expenses, categories, and payment methods</li>
                <li>All monthly budget limits and alert configurations</li>
                <li>4-digit PIN security hash and WebAuthn credentials</li>
                <li>Your profile preferences and account credentials</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300">
                To confirm, type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                autoFocus
                className="block w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 font-mono font-bold placeholder-surface-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAccount}
                isLoading={isDeleting}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="text-xs"
              >
                Delete My Account Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
