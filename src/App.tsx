import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { ActiveTab, Expense } from './types';

import { AuthScreen } from './components/auth/AuthScreen';
import { useAuth } from './context/AuthContext';

// Layout & UI
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/ui/Toast';

// Modals & Overlays
import { LockScreenModal } from './components/security/LockScreenModal';
import { SecuritySettingsModal } from './components/security/SecuritySettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { BudgetModal } from './components/budget/BudgetModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ExpenseList } from './components/expenses/ExpenseList';
import { BudgetList } from './components/budget/BudgetList';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 transition-colors">
      {/* Toast alerts container */}
      <ToastContainer />

      {/* Global Device Lock Overlay (PIN / WebAuthn) */}
      <LockScreenModal />

      {/* Email Verification Pending Banner */}
      <EmailVerificationBanner />

      {/* Top Navbar */}
      <Navbar
        onOpenAddExpense={handleOpenAddExpense}
        onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
        />

        {/* Dynamic Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddExpense={handleOpenAddExpense}
              onOpenEditExpense={handleOpenEditExpense}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              onViewAllExpenses={() => setActiveTab('expenses')}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'expenses' && (
            <div className="space-y-4 pb-12">
              <div>
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">
                  Transactions Ledger
                </h2>
                <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
                  Search, multi-filter, inspect, export, or edit all recorded expenses
                </p>
              </div>
              <ExpenseList
                onOpenAddExpense={handleOpenAddExpense}
                onOpenEditExpense={handleOpenEditExpense}
              />
            </div>
          )}

          {activeTab === 'budgets' && (
            <div className="space-y-4 pb-12">
              <div>
                <h2 className="text-2xl font-extrabold text-surface-900 dark:text-surface-100">
                  Monthly Budget Management
                </h2>
                <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
                  Establish spending thresholds and monitor color-shifting budget alerts
                </p>
              </div>
              <BudgetList onOpenBudgetModal={() => setIsBudgetModalOpen(true)} />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddExpense={handleOpenAddExpense}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, isDemoMode, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">Loading ExpenseTracker...</p>
        </div>
      </div>
    );
  }

  // Show AuthScreen if user is not authenticated and not in demo mode
  if (!user && !isDemoMode) {
    return <AuthScreen />;
  }

  return (
    <SecurityProvider>
      <ExpenseProvider>
        <MainLayout />
      </ExpenseProvider>
    </SecurityProvider>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
