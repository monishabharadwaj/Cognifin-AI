import { create } from 'zustand';
import type { Transaction, Budget, Goal, Trip } from '@/types/finance';
import { apiClient } from '@/services/api';

interface FinanceStore {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  trips: Trip[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchTrips: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (b: Budget) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addGoalFunds: (goalId: string, amount: number) => void;
  addGoal: (g: Goal) => void;
  completeGoal: (id: string) => void;
  addTrip: (t: Trip) => void;
  updateTripStatus: (id: string, status: Trip['status']) => void;
  deleteTrip: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  transactions: [],
  budgets: [],
  goals: [],
  trips: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await apiClient.getTransactions();
      set({ transactions, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const budgets = await apiClient.getBudgets();
      set({ budgets, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const goals = await apiClient.getGoals();
      set({ goals, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const trips = await apiClient.getTrips();
      set({ trips, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addTransaction: async (t: Omit<Transaction, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      const newTransaction = await apiClient.createTransaction(t);
      // Re-fetch all transactions to ensure consistency
      await get().fetchTransactions();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  deleteTransaction: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteTransaction(id);
      // Re-fetch all transactions to ensure consistency
      await get().fetchTransactions();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateBudget: async (b: Budget) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.updateBudget(b.id, b);
      // Re-fetch all budgets to ensure consistency
      await get().fetchBudgets();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  addBudget: async (b: Omit<Budget, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.createBudget(b);
      // Re-fetch all budgets to ensure consistency
      await get().fetchBudgets();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  deleteBudget: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteBudget(id);
      // Re-fetch all budgets to ensure consistency
      await get().fetchBudgets();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addGoalFunds: (goalId, amount) =>
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === goalId ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) } : g
      ),
    })),
  addGoal: (g) => set((s) => ({ goals: [...s.goals, g] })),
  completeGoal: (id) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, is_completed: true, currentAmount: g.targetAmount } : g)),
    })),

  addTrip: (t) => set((s) => ({ trips: [...s.trips, t] })),
  updateTripStatus: (id, status) =>
    set((s) => ({ trips: s.trips.map((t) => (t.id === id ? { ...t, status } : t)) })),
  deleteTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
}));
