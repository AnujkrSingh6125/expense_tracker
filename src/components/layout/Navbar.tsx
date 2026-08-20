import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSecurity } from '../../context/SecurityContext';
import { useTheme } from '../../context/ThemeContext';
import { CURRENCIES } from '../../lib/constants';
import { MonthYearPicker } from './MonthYearPicker';
import { Button } from '../ui/Button';
import {
  Plus,
  Lock,
  Moon,
  Sun,
  Shield,
  ShieldCheck,
  User,
  LogOut,
  Wallet,
} from 'lucide-react';

interface NavbarProps {
  onOpenAddExpense: () => void;
  onOpenSecuritySettings: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddExpense,
  onOpenSecuritySettings,
  onOpenAuthModal,
}) => {
  const { user, profile, updateProfile, isDemoMode, signOut } = useAuth();
  const { lockApp, hasSecurityConfigured } = useSecurity();
  const { theme, toggleTheme } = useTheme();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-surface-900 dark:text-surface-50 tracking-tight">
                Expense<span className="text-brand-600 dark:text-brand-400">Tracker</span>
              </span>
              {isDemoMode && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Demo
                </span>
              )}
            </div>
            <p className="text-[11px] text-surface-400 hidden sm:block">Smart Budget & Domain Analytics</p>
          </div>
        </div>

        {/* Center: Month/Year selector */}
        <div className="hidden md:flex items-center">
          <MonthYearPicker />
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Expense Button */}
          <Button
            size="sm"
            onClick={onOpenAddExpense}
            leftIcon={<Plus className="w-4 h-4" />}
            className="hidden sm:inline-flex bg-brand-600 hover:bg-brand-700"
          >
            Add Expense
          </Button>

          {/* Quick lock button */}
          <button
            onClick={() => {
              if (hasSecurityConfigured) {
                lockApp();
              } else {
                onOpenSecuritySettings();
              }
            }}
            title={hasSecurityConfigured ? 'Lock Application' : 'Configure Security Lock'}
            className="p-2 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
          >
            {hasSecurityConfigured ? (
              <Lock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
          </button>

          {/* Currency Switcher Dropdown */}
          <div className="relative">
            <select
              value={profile?.currency || '₹'}
              onChange={async (e) => {
                const newCurr = e.target.value;
                await updateProfile({ currency: newCurr });
              }}
              title="Change Display Currency"
              className="bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200 text-xs font-bold py-1.5 px-2.5 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-surface-700" />
            )}
          </button>

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center border border-brand-500/20">
                  {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 p-2 z-50 animate-slide-up">
                    <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-700/60">
                      <p className="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate">
                        {profile?.full_name || 'User Account'}
                      </p>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenSecuritySettings();
                        }}
                        className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50"
                      >
                        <ShieldCheck className="w-4 h-4 text-brand-500" />
                        <span>Security & PIN Lock</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAuthModal}
              leftIcon={<User className="w-4 h-4" />}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
