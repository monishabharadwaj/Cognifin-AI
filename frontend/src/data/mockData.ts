import type { Transaction, Budget, Goal, Trip, FinancialHealth } from '@/types/finance';

export const mockTransactions: Transaction[] = [
  { id: '1', date: '2026-03-12', description: 'Grocery Store', amount: 2500, type: 'expense', category: 'Food', ai_risk_level: 'low', anomaly_score: 8, ai_explanation: 'Normal grocery purchase within typical range.' },
  { id: '2', date: '2026-03-12', description: 'Salary Credit', amount: 85000, type: 'income', category: 'Salary', ai_risk_level: 'low', anomaly_score: 2, ai_explanation: 'Regular monthly salary deposit.' },
  { id: '3', date: '2026-03-11', description: 'Netflix Subscription', amount: 649, type: 'expense', category: 'Entertainment', ai_risk_level: 'low', anomaly_score: 5, ai_explanation: 'Recurring subscription payment.' },
  { id: '4', date: '2026-03-11', description: 'Gas Station', amount: 1800, type: 'expense', category: 'Transport', ai_risk_level: 'low', anomaly_score: 12, ai_explanation: 'Fuel expense within normal range.' },
  { id: '5', date: '2026-03-10', description: 'Restaurant Dinner', amount: 1200, type: 'expense', category: 'Dining', ai_risk_level: 'low', anomaly_score: 15, ai_explanation: 'Dining expense, slightly above average.' },
  { id: '6', date: '2026-03-09', description: 'Freelance Payment', amount: 15000, type: 'income', category: 'Freelance', ai_risk_level: 'low', anomaly_score: 3, ai_explanation: 'Expected freelance income.' },
  { id: '7', date: '2026-03-08', description: 'Electric Bill', amount: 2200, type: 'expense', category: 'Utilities', ai_risk_level: 'low', anomaly_score: 10, ai_explanation: 'Monthly utility bill.' },
  { id: '8', date: '2026-03-07', description: 'Online Shopping Spree', amount: 18500, type: 'expense', category: 'Shopping', ai_risk_level: 'high', anomaly_score: 87, ai_explanation: '⚠️ Unusual spending pattern detected — 340% above your average shopping spend.' },
  { id: '9', date: '2026-03-06', description: 'Gym Membership', amount: 1500, type: 'expense', category: 'Health', ai_risk_level: 'low', anomaly_score: 4, ai_explanation: 'Regular gym subscription.' },
  { id: '10', date: '2026-03-05', description: 'Mutual Fund SIP', amount: 5000, type: 'expense', category: 'Investment', ai_risk_level: 'low', anomaly_score: 1, ai_explanation: 'Scheduled investment.' },
  { id: '11', date: '2026-03-04', description: 'Late Night ATM Withdrawal', amount: 8000, type: 'expense', category: 'Shopping', ai_risk_level: 'medium', anomaly_score: 62, ai_explanation: '⚠️ Unusual ATM withdrawal at 2:30 AM — outside normal transaction hours.' },
  { id: '12', date: '2026-03-03', description: 'International Transfer', amount: 25000, type: 'expense', category: 'Shopping', ai_risk_level: 'high', anomaly_score: 91, ai_explanation: '🔴 Suspicious international transfer — no prior history of international transactions.' },
];

export const mockBudgets: Budget[] = [
  { id: '1', category: 'Food & Groceries', budgetAmount: 10000, spentAmount: 7500, period: 'monthly', icon: '🍕' },
  { id: '2', category: 'Transport', budgetAmount: 5000, spentAmount: 3800, period: 'monthly', icon: '🚗' },
  { id: '3', category: 'Entertainment', budgetAmount: 3000, spentAmount: 2900, period: 'monthly', icon: '🎬' },
  { id: '4', category: 'Shopping', budgetAmount: 5000, spentAmount: 5200, period: 'monthly', icon: '🛍️' },
  { id: '5', category: 'Utilities', budgetAmount: 4000, spentAmount: 2200, period: 'monthly', icon: '💡' },
  { id: '6', category: 'Health', budgetAmount: 3000, spentAmount: 1500, period: 'monthly', icon: '🏥' },
];

export const mockGoals: Goal[] = [
  { id: '1', title: 'Emergency Fund', targetAmount: 300000, currentAmount: 240000, deadline: '2026-12-31', category: 'emergency', icon: '🛡️', is_completed: false },
  { id: '2', title: 'Goa Vacation', targetAmount: 50000, currentAmount: 32000, deadline: '2026-06-15', category: 'vacation', icon: '✈️', is_completed: false },
  { id: '3', title: 'New Laptop', targetAmount: 80000, currentAmount: 25000, deadline: '2026-09-01', category: 'purchase', icon: '💻', is_completed: false },
  { id: '4', title: 'Education Course', targetAmount: 40000, currentAmount: 40000, deadline: '2026-04-01', category: 'education', icon: '📚', is_completed: true },
];

export const mockTrips: Trip[] = [
  {
    id: '1', destination: 'Goa', startDate: '2026-06-15', endDate: '2026-06-20', travelers: 2,
    totalBudget: 50000, savedAmount: 32000, type: 'domestic', status: 'confirmed',
    breakdown: [
      { category: 'Travel', amount: 12000, percentage: 24 },
      { category: 'Accommodation', amount: 18000, percentage: 36 },
      { category: 'Food', amount: 10000, percentage: 20 },
      { category: 'Activities', amount: 7000, percentage: 14 },
      { category: 'Transport', amount: 3000, percentage: 6 },
    ],
  },
  {
    id: '2', destination: 'Manali', startDate: '2026-09-10', endDate: '2026-09-15', travelers: 4,
    totalBudget: 80000, savedAmount: 15000, type: 'domestic', status: 'planning',
    breakdown: [
      { category: 'Travel', amount: 24000, percentage: 30 },
      { category: 'Accommodation', amount: 28000, percentage: 35 },
      { category: 'Food', amount: 12000, percentage: 15 },
      { category: 'Activities', amount: 10000, percentage: 12.5 },
      { category: 'Transport', amount: 6000, percentage: 7.5 },
    ],
  },
];

export const mockHealthScore: FinancialHealth = {
  overallScore: 82,
  savingsRate: 85,
  budgetAdherence: 78,
  emergencyFund: 80,
  debtManagement: 90,
  investmentDiversity: 70,
};

export const monthlyData = [
  { month: 'Oct', income: 85000, expenses: 52000, savings: 33000 },
  { month: 'Nov', income: 92000, expenses: 58000, savings: 34000 },
  { month: 'Dec', income: 105000, expenses: 72000, savings: 33000 },
  { month: 'Jan', income: 88000, expenses: 55000, savings: 33000 },
  { month: 'Feb', income: 90000, expenses: 51000, savings: 39000 },
  { month: 'Mar', income: 100000, expenses: 54000, savings: 46000 },
];

export const categoryData = [
  { name: 'Food', value: 8500, color: 'hsl(217, 91%, 60%)' },
  { name: 'Transport', value: 5200, color: 'hsl(142, 71%, 45%)' },
  { name: 'Entertainment', value: 3200, color: 'hsl(38, 92%, 50%)' },
  { name: 'Shopping', value: 6800, color: 'hsl(262, 83%, 58%)' },
  { name: 'Utilities', value: 4200, color: 'hsl(0, 84%, 60%)' },
  { name: 'Health', value: 2800, color: 'hsl(180, 60%, 45%)' },
  { name: 'Dining', value: 4500, color: 'hsl(320, 70%, 50%)' },
  { name: 'Investment', value: 5000, color: 'hsl(200, 80%, 50%)' },
];
