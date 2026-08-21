import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { GroupProvider, useGroups } from './context/GroupContext';
import { ActiveTab, AppSpace, Expense, GroupExpense } from './types';

// Auth Screen
import { AuthScreen } from './components/auth/AuthScreen';
import { ResetPasswordModal } from './components/auth/ResetPasswordModal';

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

// Group Modals & Views
import { CreateGroupModal } from './components/groups/CreateGroupModal';
import { JoinGroupModal } from './components/groups/JoinGroupModal';
import { GroupExpenseModal } from './components/groups/GroupExpenseModal';
import { GroupMembersModal } from './components/groups/GroupMembersModal';
import { GroupListView } from './components/groups/GroupListView';
import { GroupDashboardView } from './components/groups/GroupDashboardView';

// Personal Views
import { DashboardView } from './components/dashboard/DashboardView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ExpenseList } from './components/expenses/ExpenseList';
import { BudgetList } from './components/budget/BudgetList';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  // Navigation & Workspace State
  const [appSpace, setAppSpace] = useState<AppSpace>('personal');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const { isPasswordRecovery, setIsPasswordRecovery } = useAuth();
  const { activeGroup, setActiveGroupId } = useGroups();

  // Personal Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Group Modal States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState<boolean>(false);
  const [isGroupExpenseOpen, setIsGroupExpenseOpen] = useState<boolean>(false);
  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState<boolean>(false);
  const [groupExpenseToEdit, setGroupExpenseToEdit] = useState<GroupExpense | null>(null);

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenAddGroupExpense = () => {
    setGroupExpenseToEdit(null);
    setIsGroupExpenseOpen(true);
  };

  const handleOpenEditGroupExpense = (expense: GroupExpense) => {
    setGroupExpenseToEdit(expense);
    setIsGroupExpenseOpen(true);
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
        appSpace={appSpace}
        setAppSpace={setAppSpace}
        onOpenAddExpense={handleOpenAddExpense}
        onOpenAddGroupExpense={handleOpenAddGroupExpense}
        onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          appSpace={appSpace}
          setAppSpace={setAppSpace}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
        />

        {/* Dynamic Main Content View */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 max-w-full pb-28 md:pb-8">
          {appSpace === 'groups' ? (
            /* COLLABORATIVE GROUP EXPENSE SPACES */
            activeGroup ? (
              <GroupDashboardView
                onBack={() => setActiveGroupId(null)}
                onOpenAddExpense={handleOpenAddGroupExpense}
                onOpenEditExpense={handleOpenEditGroupExpense}
                onOpenMembersModal={() => setIsGroupMembersOpen(true)}
              />
            ) : (
              <GroupListView
                onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
              />
            )
          ) : (
            /* PERSONAL EXPENSE TRACKER VIEWS */
            <>
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
                      Search, multi-filter, inspect, export, or edit all recorded personal expenses
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
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        appSpace={appSpace}
        setAppSpace={setAppSpace}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddExpense={handleOpenAddExpense}
        onOpenAddGroupExpense={handleOpenAddGroupExpense}
      />

      {/* Personal Modals */}
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

      {/* Collaborative Group Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
      />

      <GroupExpenseModal
        isOpen={isGroupExpenseOpen}
        onClose={() => {
          setIsGroupExpenseOpen(false);
          setGroupExpenseToEdit(null);
        }}
        expenseToEdit={groupExpenseToEdit}
      />

      <GroupMembersModal
        isOpen={isGroupMembersOpen}
        onClose={() => setIsGroupMembersOpen(false)}
      />

      {/* Password Reset Recovery Modal */}
      <ResetPasswordModal
        isOpen={isPasswordRecovery}
        onClose={() => setIsPasswordRecovery(false)}
        initialMode="set_new_password"
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, isDemoMode, isLoading, isPasswordRecovery } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">Loading Master Tracker...</p>
        </div>
      </div>
    );
  }

  // Show AuthScreen if user is not authenticated, not in recovery, and not in demo mode
  if (!user && !isDemoMode && !isPasswordRecovery) {
    return <AuthScreen />;
  }

  return <MainLayout />;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ExpenseProvider>
          <SecurityProvider>
            <GroupProvider>
              <AppContent />
            </GroupProvider>
          </SecurityProvider>
        </ExpenseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
