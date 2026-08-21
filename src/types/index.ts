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
  custom_domain?: string | null; // e.g. "acme-corp" or workspace handle
  custom_domains?: string[]; // e.g. ["Personal", "Business", "Freelance", "Side-Hustle", "Trip"]
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
  domain?: string; // e.g. 'Personal', 'Business', 'Freelance'
  description: string | null;
  payment_method: PaymentMethod;
  expense_date: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseFilterState {
  searchQuery: string;
  category: string; // 'All' or specific category
  domain?: string; // 'All' or specific domain
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
  count: number;
  topCategory?: string;
  momChangePct?: number | null;
  domainBreakdown?: Record<string, number>;
}

export type ActiveTab = 'dashboard' | 'analytics' | 'expenses' | 'budgets' | 'settings';

export type AppSpace = 'personal' | 'groups';

// ==========================================
// Collaborative Group Expense Types
// ==========================================

export type SplitType = 'equal' | 'custom' | 'percentage';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type SyncAction =
  | 'create_expense'
  | 'update_expense'
  | 'delete_expense'
  | 'create_group'
  | 'join_group'
  | 'settle_split';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  join_code: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  member_count?: number;
  user_net_balance?: number;
  sync_status?: SyncStatus;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface GroupExpenseSplit {
  id: string;
  group_expense_id: string;
  user_id: string;
  owed_amount: number;
  settled: boolean;
  created_at?: string;
  user_profile?: Profile;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  title: string;
  category: string;
  domain?: string; // e.g. 'General', 'Trip', 'Project', 'Household'
  split_type: SplitType;
  expense_date: string; // YYYY-MM-DD
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  sync_status?: SyncStatus;
  temp_id?: string;
  payer_profile?: Profile;
  splits?: GroupExpenseSplit[];
}

export interface GroupSettlement {
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: number;
}

export interface GroupMemberSummary {
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  total_paid: number;
  total_owed: number;
  net_balance: number;
  percentage_of_total: number;
}

export interface GroupMetricSummary {
  total_group_spend: number;
  user_total_paid: number;
  user_total_owed: number;
  user_net_balance: number;
  expense_count: number;
  member_count: number;
}

export interface SyncQueueItem {
  id: string;
  temp_id?: string;
  action: SyncAction;
  entity: 'group' | 'member' | 'expense' | 'split';
  payload: any;
  status: SyncStatus;
  created_at: string;
  retry_count: number;
  error_message?: string;
}
