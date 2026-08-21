import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Expense,
  Budget,
  ExpenseFilterState,
  DashboardMetrics,
  CategorySummary,
  DailySpending,
  MonthlySpendingHistory,
} from '../types';
import { getCategoryMeta, MONTH_NAMES_SHORT } from '../lib/constants';
import { generateUUID } from '../lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ExpenseContextType {
  expenses: Expense[];
  filteredExpenses: Expense[];
  budgets: Budget[];
  currentMonthBudget: Budget | null;
  isLoading: boolean;
  filters: ExpenseFilterState;
  setFilters: React.Dispatch<React.SetStateAction<ExpenseFilterState>>;
  updateFilter: (key: keyof ExpenseFilterState, value: unknown) => void;
  resetFilters: () => void;
  metrics: DashboardMetrics;
  categorySummaries: CategorySummary[];
  dailySpending: DailySpending[];
  annualSpendingHistory: MonthlySpendingHistory[];
  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ error: Error | null }>;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'user_id'>>) => Promise<{ error: Error | null }>;
  deleteExpense: (id: string) => Promise<{ error: Error | null }>;
  setMonthlyBudget: (month: number, year: number, amountLimit: number, alertThresholdPct?: number) => Promise<{ error: Error | null }>;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const DEMO_EXPENSES_STORAGE_KEY = 'et_demo_expenses';
const DEMO_BUDGETS_STORAGE_KEY = 'et_demo_budgets';

// Generate mock data for demo mode
function generateDemoData(): { expenses: Expense[]; budgets: Budget[] } {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const pad = (n: number) => n.toString().padStart(2, '0');

  const demoBudgets: Budget[] = [
    {
      id: 'b-1',
      user_id: 'demo-user-12345',
      month: currentMonth,
      year: currentYear,
      amount_limit: 45000,
      alert_threshold_pct: 80,
    },
    {
      id: 'b-2',
      user_id: 'demo-user-12345',
      month: currentMonth === 1 ? 12 : currentMonth - 1,
      year: currentMonth === 1 ? currentYear - 1 : currentYear,
      amount_limit: 42000,
      alert_threshold_pct: 80,
    },
  ];

  const demoExpenses: Expense[] = [
    {
      id: 'exp-1',
      user_id: 'demo-user-12345',
      amount: 18000,
      category: 'Rent',
      domain: 'Household',
      description: 'Monthly Apartment Rent',
      payment_method: 'Bank Transfer',
      expense_date: `${currentYear}-${pad(currentMonth)}-01`,
    },
    {
      id: 'exp-2',
      user_id: 'demo-user-12345',
      amount: 3450,
      category: 'Grocery',
      domain: 'Household',
      description: 'Weekly organic groceries, vegetables & supplies',
      payment_method: 'UPI',
      expense_date: `${currentYear}-${pad(currentMonth)}-03`,
    },
    {
      id: 'exp-3',
      user_id: 'demo-user-12345',
      amount: 2200,
      category: 'Utilities',
      domain: 'Household',
      description: 'Electricity & High-speed Fiber Internet bill',
      payment_method: 'UPI',
      expense_date: `${currentYear}-${pad(currentMonth)}-05`,
    },
    {
      id: 'exp-4',
      user_id: 'demo-user-12345',
      amount: 2850,
      category: 'Party/Dining',
      domain: 'Personal',
      description: 'Weekend dinner with friends',
      payment_method: 'Card',
      expense_date: `${currentYear}-${pad(currentMonth)}-08`,
    },
    {
      id: 'exp-5',
      user_id: 'demo-user-12345',
      amount: 1500,
      category: 'Transport',
      domain: 'Personal',
      description: 'Cab rides & Metro card recharge',
      payment_method: 'UPI',
      expense_date: `${currentYear}-${pad(currentMonth)}-10`,
    },
    {
      id: 'exp-6',
      user_id: 'demo-user-12345',
      amount: 4200,
      category: 'Shopping',
      domain: 'Business',
      description: 'Ergonomic office accessories & electronics',
      payment_method: 'Card',
      expense_date: `${currentYear}-${pad(currentMonth)}-12`,
    },
    {
      id: 'exp-7',
      user_id: 'demo-user-12345',
      amount: 2100,
      category: 'Grocery',
      domain: 'Household',
      description: 'Supermarket fruits, dairy & household items',
      payment_method: 'UPI',
      expense_date: `${currentYear}-${pad(currentMonth)}-15`,
    },
    {
      id: 'exp-8',
      user_id: 'demo-user-12345',
      amount: 1200,
      category: 'Healthcare',
      domain: 'Personal',
      description: 'Pharmacy medicines & routine checkup',
      payment_method: 'Card',
      expense_date: `${currentYear}-${pad(currentMonth)}-18`,
    },
    {
      id: 'exp-9',
      user_id: 'demo-user-12345',
      amount: 950,
      category: 'Entertainment',
      domain: 'Personal',
      description: 'Movie tickets & OTT subscription',
      payment_method: 'UPI',
      expense_date: `${currentYear}-${pad(currentMonth)}-20`,
    },
    {
      id: 'exp-10',
      user_id: 'demo-user-12345',
      amount: 1400,
      category: 'Party/Dining',
      domain: 'Freelance',
      description: 'Café meet & client lunch',
      payment_method: 'Card',
      expense_date: `${currentYear}-${pad(currentMonth)}-22`,
    },
  ];

  return { expenses: demoExpenses, budgets: demoBudgets };
}

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode, profile } = useAuth();
  const currency = profile?.currency || '₹';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const today = new Date();
  const [filters, setFilters] = useState<ExpenseFilterState>({
    searchQuery: '',
    category: 'All',
    domain: 'All',
    paymentMethod: 'All',
    startDate: '',
    endDate: '',
    selectedMonth: today.getMonth() + 1,
    selectedYear: today.getFullYear(),
    viewMode: 'month',
    sortBy: 'date-desc',
  });

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateUUID();
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch initial data
  const refreshData = useCallback(async () => {
    setIsLoading(true);

    if (isDemoMode || !isSupabaseConfigured || !user) {
      // Load demo data from localStorage or default
      const savedExpenses = localStorage.getItem(DEMO_EXPENSES_STORAGE_KEY);
      const savedBudgets = localStorage.getItem(DEMO_BUDGETS_STORAGE_KEY);

      if (savedExpenses && savedBudgets) {
        try {
          setExpenses(JSON.parse(savedExpenses));
          setBudgets(JSON.parse(savedBudgets));
        } catch {
          const initial = generateDemoData();
          setExpenses(initial.expenses);
          setBudgets(initial.budgets);
        }
      } else {
        const initial = generateDemoData();
        setExpenses(initial.expenses);
        setBudgets(initial.budgets);
        localStorage.setItem(DEMO_EXPENSES_STORAGE_KEY, JSON.stringify(initial.expenses));
        localStorage.setItem(DEMO_BUDGETS_STORAGE_KEY, JSON.stringify(initial.budgets));
      }
      setIsLoading(false);
      return;
    }

    try {
      const [expensesRes, budgetsRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false }),
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id),
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (budgetsRes.error) throw budgetsRes.error;

      setExpenses(expensesRes.data as Expense[]);
      setBudgets(budgetsRes.data as Budget[]);
    } catch (err) {
      console.error('Error fetching expenses/budgets:', err);
      addToast({
        type: 'error',
        title: 'Sync Error',
        message: 'Could not fetch latest expenses from Supabase.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode, user, addToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Current selected month budget
  const currentMonthBudget = useMemo(() => {
    return (
      budgets.find(
        (b) => b.month === filters.selectedMonth && b.year === filters.selectedYear
      ) || null
    );
  }, [budgets, filters.selectedMonth, filters.selectedYear]);

  // Filtered expenses based on search, category, domain, payment method, date/month
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const expDate = new Date(exp.expense_date);
      const expYear = expDate.getFullYear();
      const expMonth = expDate.getMonth() + 1;

      // Month/Year or custom date filter
      if (filters.viewMode === 'month') {
        if (expYear !== filters.selectedYear || expMonth !== filters.selectedMonth) {
          return false;
        }
      } else if (filters.viewMode === 'year') {
        if (expYear !== filters.selectedYear) {
          return false;
        }
      } else if (filters.viewMode === 'custom') {
        if (filters.startDate && exp.expense_date < filters.startDate) return false;
        if (filters.endDate && exp.expense_date > filters.endDate) return false;
      }

      // Category filter
      if (filters.category !== 'All' && exp.category !== filters.category) {
        return false;
      }

      // Domain filter
      if (filters.domain && filters.domain !== 'All' && (exp.domain || 'Personal') !== filters.domain) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethod !== 'All' && exp.payment_method !== filters.paymentMethod) {
        return false;
      }

      // Search query (matches description, category, or domain)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const descMatch = (exp.description || '').toLowerCase().includes(query);
        const catMatch = exp.category.toLowerCase().includes(query);
        const domMatch = (exp.domain || 'Personal').toLowerCase().includes(query);
        const methodMatch = exp.payment_method.toLowerCase().includes(query);
        if (!descMatch && !catMatch && !domMatch && !methodMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'date-desc') {
        return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
      }
      if (filters.sortBy === 'date-asc') {
        return new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      }
      if (filters.sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (filters.sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [expenses, filters]);

  // Compute Dashboard Metrics for selected month & year
  const metrics: DashboardMetrics = useMemo(() => {
    const monthExpenses = expenses.filter((exp) => {
      const d = new Date(exp.expense_date);
      return d.getFullYear() === filters.selectedYear && d.getMonth() + 1 === filters.selectedMonth;
    });

    const totalSpentThisMonth = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

    // Previous month expenses for trend comparison
    const prevMonth = filters.selectedMonth === 1 ? 12 : filters.selectedMonth - 1;
    const prevYear = filters.selectedMonth === 1 ? filters.selectedYear - 1 : filters.selectedYear;
    const prevMonthExpenses = expenses.filter((exp) => {
      const d = new Date(exp.expense_date);
      return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth;
    });
    const previousMonthSpend = prevMonthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

    const momChangePct =
      previousMonthSpend > 0
        ? ((totalSpentThisMonth - previousMonthSpend) / previousMonthSpend) * 100
        : null;

    const monthlyBudget = currentMonthBudget ? Number(currentMonthBudget.amount_limit) : null;
    const remainingBudget = monthlyBudget !== null ? monthlyBudget - totalSpentThisMonth : null;
    const budgetPercentage = monthlyBudget !== null && monthlyBudget > 0 ? (totalSpentThisMonth / monthlyBudget) * 100 : 0;

    const activeThreshold = currentMonthBudget?.alert_threshold_pct || 80;
    const isOverBudget = monthlyBudget !== null && totalSpentThisMonth >= monthlyBudget;
    const isNearThreshold =
      monthlyBudget !== null &&
      !isOverBudget &&
      totalSpentThisMonth >= (monthlyBudget * activeThreshold) / 100;

    // Highest Domain / Category
    const categoryTotals: Record<string, number> = {};
    monthExpenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
    });

    let highestDomain: { category: string; amount: number; percentage: number } | null = null;
    let maxCatAmount = 0;

    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > maxCatAmount) {
        maxCatAmount = amt;
        highestDomain = {
          category: cat,
          amount: amt,
          percentage: totalSpentThisMonth > 0 ? (amt / totalSpentThisMonth) * 100 : 0,
        };
      }
    });

    // Daily Average
    const daysInMonth = new Date(filters.selectedYear, filters.selectedMonth, 0).getDate();
    const currentDay =
      filters.selectedYear === today.getFullYear() && filters.selectedMonth === today.getMonth() + 1
        ? today.getDate()
        : daysInMonth;
    const dailyAverageSpend = currentDay > 0 ? totalSpentThisMonth / currentDay : 0;

    return {
      totalSpentThisMonth,
      monthlyBudget,
      remainingBudget,
      budgetPercentage,
      highestDomain,
      dailyAverageSpend,
      previousMonthSpend,
      monthOverMonthChangePct: momChangePct,
      activeThreshold,
      isOverBudget,
      isNearThreshold,
    };
  }, [expenses, filters.selectedMonth, filters.selectedYear, currentMonthBudget]);

  // Category Summaries with Percentages for Selected View
  const categorySummaries: CategorySummary[] = useMemo(() => {
    const totals: Record<string, { amount: number; count: number }> = {};
    let totalAll = 0;

    filteredExpenses.forEach((exp) => {
      const amt = Number(exp.amount);
      totalAll += amt;
      if (!totals[exp.category]) {
        totals[exp.category] = { amount: 0, count: 0 };
      }
      totals[exp.category].amount += amt;
      totals[exp.category].count += 1;
    });

    return Object.entries(totals)
      .map(([category, { amount, count }]) => {
        const meta = getCategoryMeta(category);
        return {
          category,
          amount,
          count,
          percentage: totalAll > 0 ? (amount / totalAll) * 100 : 0,
          color: meta.color,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Daily Spending for selected month
  const dailySpending: DailySpending[] = useMemo(() => {
    const daysCount = new Date(filters.selectedYear, filters.selectedMonth, 0).getDate();
    const dailyMap: Record<number, { amount: number; count: number }> = {};

    for (let day = 1; day <= daysCount; day++) {
      dailyMap[day] = { amount: 0, count: 0 };
    }

    expenses.forEach((exp) => {
      const d = new Date(exp.expense_date);
      if (d.getFullYear() === filters.selectedYear && d.getMonth() + 1 === filters.selectedMonth) {
        const day = d.getDate();
        if (dailyMap[day]) {
          dailyMap[day].amount += Number(exp.amount);
          dailyMap[day].count += 1;
        }
      }
    });

    return Object.entries(dailyMap).map(([dayStr, data]) => {
      const day = Number(dayStr);
      return {
        day,
        dateStr: `${MONTH_NAMES_SHORT[filters.selectedMonth - 1]} ${day}`,
        amount: data.amount,
        count: data.count,
      };
    });
  }, [expenses, filters.selectedMonth, filters.selectedYear]);

  // Annual Month-over-Month History for selected year with Rich Hover Telemetry
  const annualSpendingHistory: MonthlySpendingHistory[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const monthIndex = idx + 1;
      const monthExpenses = expenses.filter((exp) => {
        const d = new Date(exp.expense_date);
        return d.getFullYear() === filters.selectedYear && d.getMonth() + 1 === monthIndex;
      });
      const amount = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
      const budgetObj = budgets.find((b) => b.year === filters.selectedYear && b.month === monthIndex);

      // Compute domain breakdown for this month
      const domainBreakdown: Record<string, number> = {};
      const catBreakdown: Record<string, number> = {};
      monthExpenses.forEach((e) => {
        const dom = e.domain || 'Personal';
        domainBreakdown[dom] = (domainBreakdown[dom] || 0) + Number(e.amount);
        catBreakdown[e.category] = (catBreakdown[e.category] || 0) + Number(e.amount);
      });

      // Top category
      let topCategory = 'None';
      let topCategoryAmount = 0;
      Object.entries(catBreakdown).forEach(([cat, amt]) => {
        if (amt > topCategoryAmount) {
          topCategoryAmount = amt;
          topCategory = cat;
        }
      });

      // Prev month spend for MoM %
      const prevMonthIdx = monthIndex === 1 ? 12 : monthIndex - 1;
      const prevYear = monthIndex === 1 ? filters.selectedYear - 1 : filters.selectedYear;
      const prevMonthExpenses = expenses.filter((exp) => {
        const d = new Date(exp.expense_date);
        return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonthIdx;
      });
      const prevAmount = prevMonthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
      const momChangePct = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : null;

      return {
        month: monthIndex,
        monthName: MONTH_NAMES_SHORT[idx],
        amount,
        budgetLimit: budgetObj ? Number(budgetObj.amount_limit) : 0,
        count: monthExpenses.length,
        topCategory: topCategory !== 'None' ? topCategory : undefined,
        momChangePct,
        domainBreakdown,
      };
    });
  }, [expenses, budgets, filters.selectedYear]);

  // Check budget thresholds and alert user
  const checkBudgetAlerts = useCallback(
    (newTotal: number, budgetObj: Budget | null) => {
      if (!budgetObj) return;
      const limit = Number(budgetObj.amount_limit);
      const thresholdPct = budgetObj.alert_threshold_pct || 80;
      const thresholdAmount = (limit * thresholdPct) / 100;

      if (newTotal >= limit) {
        addToast({
          type: 'error',
          title: '🚨 Budget Exceeded!',
          message: `Total monthly spend is now ${currency}${newTotal.toFixed(2)}, which exceeds your budget limit of ${currency}${limit.toFixed(2)}.`,
          duration: 7000,
        });
      } else if (newTotal >= thresholdAmount) {
        addToast({
          type: 'warning',
          title: '⚠️ Spending Warning',
          message: `You have reached ${((newTotal / limit) * 100).toFixed(1)}% of your monthly budget limit (${currency}${newTotal.toFixed(2)} / ${currency}${limit.toFixed(2)}).`,
          duration: 6000,
        });
      }
    },
    [addToast, currency]
  );

  // CRUD: Add Expense
  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ error: Error | null }> => {
    const newId = generateUUID();
    const userId = user?.id || 'demo-user-12345';
    const nowStr = new Date().toISOString();

    const newExpense: Expense = {
      ...expenseData,
      domain: expenseData.domain || 'Personal',
      id: newId,
      user_id: userId,
      created_at: nowStr,
      updated_at: nowStr,
    };

    // Optimistic update
    const prevExpenses = [...expenses];
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);

    // Calculate new total for alert check
    const expDate = new Date(newExpense.expense_date);
    if (expDate.getFullYear() === filters.selectedYear && expDate.getMonth() + 1 === filters.selectedMonth) {
      const newTotal = updatedExpenses
        .filter((e) => {
          const d = new Date(e.expense_date);
          return d.getFullYear() === filters.selectedYear && d.getMonth() + 1 === filters.selectedMonth;
        })
        .reduce((s, e) => s + Number(e.amount), 0);

      checkBudgetAlerts(newTotal, currentMonthBudget);
    }

    if (isDemoMode || !isSupabaseConfigured) {
      localStorage.setItem(DEMO_EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
      addToast({
        type: 'success',
        title: 'Expense Added',
        message: `Successfully logged ${currency}${Number(newExpense.amount).toFixed(2)} under ${newExpense.category} [${newExpense.domain}].`,
      });
      return { error: null };
    }

    try {
      const { error } = await supabase.from('expenses').insert({
        id: newExpense.id,
        user_id: newExpense.user_id,
        amount: newExpense.amount,
        category: newExpense.category,
        domain: newExpense.domain || 'Personal',
        description: newExpense.description,
        payment_method: newExpense.payment_method,
        expense_date: newExpense.expense_date,
      });

      if (error) throw error;
      addToast({
        type: 'success',
        title: 'Expense Saved',
        message: `Successfully recorded ${newExpense.category} expense.`,
      });
      return { error: null };
    } catch (err: unknown) {
      // Revert optimistic update
      setExpenses(prevExpenses);
      const msg = (err as Error).message || 'Failed to save expense to Supabase.';
      addToast({ type: 'error', title: 'Save Failed', message: msg });
      return { error: err as Error };
    }
  };

  // CRUD: Update Expense
  const updateExpense = async (
    id: string,
    updates: Partial<Omit<Expense, 'id' | 'user_id'>>
  ): Promise<{ error: Error | null }> => {
    const prevExpenses = [...expenses];
    const updatedExpenses = expenses.map((item) =>
      item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
    );
    setExpenses(updatedExpenses);

    if (isDemoMode || !isSupabaseConfigured) {
      localStorage.setItem(DEMO_EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
      addToast({ type: 'success', title: 'Expense Updated', message: 'Changes have been saved.' });
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      addToast({ type: 'success', title: 'Expense Updated', message: 'Expense details updated.' });
      return { error: null };
    } catch (err: unknown) {
      setExpenses(prevExpenses);
      return { error: err as Error };
    }
  };

  // CRUD: Delete Expense
  const deleteExpense = async (id: string): Promise<{ error: Error | null }> => {
    const prevExpenses = [...expenses];
    const updatedExpenses = expenses.filter((item) => item.id !== id);
    setExpenses(updatedExpenses);

    if (isDemoMode || !isSupabaseConfigured) {
      localStorage.setItem(DEMO_EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
      addToast({ type: 'info', title: 'Expense Removed', message: 'Expense was successfully deleted.' });
      return { error: null };
    }

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      addToast({ type: 'info', title: 'Expense Removed', message: 'Expense was successfully deleted.' });
      return { error: null };
    } catch (err: unknown) {
      setExpenses(prevExpenses);
      return { error: err as Error };
    }
  };

  // CRUD: Set / Update Monthly Budget
  const setMonthlyBudget = async (
    month: number,
    year: number,
    amountLimit: number,
    alertThresholdPct: number = 80
  ): Promise<{ error: Error | null }> => {
    const userId = user?.id || 'demo-user-12345';
    const existingIndex = budgets.findIndex((b) => b.month === month && b.year === year);

    let updatedBudgets: Budget[];
    const budgetPayload: Budget = {
      id: existingIndex >= 0 ? budgets[existingIndex].id : generateUUID(),
      user_id: userId,
      month,
      year,
      amount_limit: amountLimit,
      alert_threshold_pct: alertThresholdPct,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      updatedBudgets = budgets.map((b, i) => (i === existingIndex ? budgetPayload : b));
    } else {
      updatedBudgets = [...budgets, budgetPayload];
    }

    setBudgets(updatedBudgets);

    if (isDemoMode || !isSupabaseConfigured) {
      localStorage.setItem(DEMO_BUDGETS_STORAGE_KEY, JSON.stringify(updatedBudgets));
      addToast({
        type: 'success',
        title: 'Budget Configured',
        message: `Monthly budget limit set to ${currency}${amountLimit.toFixed(2)} (${alertThresholdPct}% alert threshold).`,
      });
      return { error: null };
    }

    try {
      const { error } = await supabase.from('budgets').upsert(
        {
          id: budgetPayload.id,
          user_id: budgetPayload.user_id,
          month: budgetPayload.month,
          year: budgetPayload.year,
          amount_limit: budgetPayload.amount_limit,
          alert_threshold_pct: budgetPayload.alert_threshold_pct,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month,year' }
      );

      if (error) throw error;
      addToast({
        type: 'success',
        title: 'Budget Saved',
        message: `Monthly budget limit updated to ${currency}${amountLimit.toFixed(2)}.`,
      });
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const updateFilter = (key: keyof ExpenseFilterState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    const today = new Date();
    setFilters({
      searchQuery: '',
      category: 'All',
      paymentMethod: 'All',
      startDate: '',
      endDate: '',
      selectedMonth: today.getMonth() + 1,
      selectedYear: today.getFullYear(),
      viewMode: 'month',
      sortBy: 'date-desc',
    });
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        filteredExpenses,
        budgets,
        currentMonthBudget,
        isLoading,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        metrics,
        categorySummaries,
        dailySpending,
        annualSpendingHistory,
        addExpense,
        updateExpense,
        deleteExpense,
        setMonthlyBudget,
        toasts,
        addToast,
        removeToast,
        refreshData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
