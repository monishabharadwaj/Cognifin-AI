export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  recurring?: boolean;
  ai_risk_level?: 'low' | 'medium' | 'high';
  anomaly_score?: number;
  ai_explanation?: string;
}

export interface Budget {
  id: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  icon: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  icon: string;
  is_completed?: boolean;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  totalBudget: number;
  savedAmount: number;
  type: 'domestic' | 'international';
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  breakdown: { category: string; amount: number; percentage: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FinancialHealth {
  overallScore: number;
  savingsRate: number;
  budgetAdherence: number;
  emergencyFund: number;
  debtManagement: number;
  investmentDiversity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ML Service Types
export interface MLPredictionResponse {
  predicted_amount: number;
  confidence: number;
  prediction_date: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MLTransactionAnalysis {
  is_anomaly: boolean;
  anomaly_score: number;
  risk_level: 'low' | 'medium' | 'high';
  explanation: string;
  typical_range: [number, number];
  recommendation?: string;
}

export interface MLFinancialInsight {
  type: 'spending_pattern' | 'budget_alert' | 'savings_opportunity' | 'risk_warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggested_action?: string;
}

export interface MLFinancialReport {
  summary: {
    total_spent: number;
    total_income: number;
    savings_rate: number;
    largest_category: string;
    unusual_transactions: number;
  };
  insights: MLFinancialInsight[];
  predictions: MLPredictionResponse[];
  recommendations: string[];
  health_score: number;
}

// AI Dashboard Types
export interface AIDashboardData {
  summary: {
    total_income: number;
    total_expenses: number;
    balance: number;
    savings_rate: number;
    health_score: number;
  };
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  monthly: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }>;
  predicted_next_spending: {
    amount: number;
    confidence: number;
    date: string;
  };
  recent_transactions: Transaction[];
  ai_flagged_transactions: Array<{
    transaction: Transaction;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  insights: MLFinancialInsight[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
