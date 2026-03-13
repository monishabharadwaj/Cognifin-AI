import { create } from 'zustand';
import type { Transaction, Budget, Goal, Trip } from '@/types/finance';
import { mockTransactions, mockBudgets, mockGoals, mockTrips } from '@/data/mockData';

interface FinanceStore {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  trips: Trip[];
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (b: Budget) => void;
  addBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;
  addGoalFunds: (goalId: string, amount: number) => void;
  addGoal: (g: Goal) => void;
  completeGoal: (id: string) => void;
  addTrip: (t: Trip) => void;
  updateTripStatus: (id: string, status: Trip['status']) => void;
  deleteTrip: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: mockTransactions,
  budgets: mockBudgets,
  goals: mockGoals,
  trips: mockTrips,

  addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

  updateBudget: (b) => set((s) => ({ budgets: s.budgets.map((x) => (x.id === b.id ? b : x)) })),
  addBudget: (b) => set((s) => ({ budgets: [...s.budgets, b] })),
  deleteBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

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
