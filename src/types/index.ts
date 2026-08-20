export type PaymentMethod = 'Card' | 'Cash' | 'UPI' | 'Bank Transfer';

export type ExpenseCategory =
  | 'Grocery'
  | 'Party/Dining'
  | 'Rent'
  | 'Utilities'
  | 'Transport'
  | 'Shopping'
  | 'Healthcare'
  | 'Entertainment'
  | 'Custom';

export interface CategoryMeta {
  id: ExpenseCategory | string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  currency: string;
  pin_hash: string | null;
  biometric_enabled: boolean;
  biometric_credential_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: number; // 1 - 12
  year: number;
  amount_limit: number;
  alert_threshold_pct: number; // e.g. 80
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory | string;
  description: string | null;
  payment_method: PaymentMethod;
  expense_date: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseFilterState {
  searchQuery: string;
  category: string; // 'All' or specific category
  paymentMethod: string; // 'All' or specific method
  startDate: string; // YYYY-MM-DD or empty
  endDate: string; // YYYY-MM-DD or empty
  selectedMonth: number; // 1-12
  selectedYear: number;
  viewMode: 'month' | 'custom' | 'year';
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface DashboardMetrics {
  totalSpentThisMonth: number;
  monthlyBudget: number | null;
  remainingBudget: number | null;
  budgetPercentage: number;
  highestDomain: {
    category: string;
    amount: number;
    percentage: number;
  } | null;
  dailyAverageSpend: number;
  previousMonthSpend: number;
  monthOverMonthChangePct: number | null;
  activeThreshold: number;
  isOverBudget: boolean;
  isNearThreshold: boolean;
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface DailySpending {
  day: number;
  dateStr: string;
  amount: number;
  count: number;
}

export interface MonthlySpendingHistory {
  month: number;
  monthName: string;
  amount: number;
  budgetLimit: number;
}

export type ActiveTab = 'dashboard' | 'analytics' | 'expenses' | 'budgets' | 'settings';
