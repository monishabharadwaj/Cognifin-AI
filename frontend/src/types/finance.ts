export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  recurring?: boolean;
  ai_risk_level?: "low" | "medium" | "high";
  anomaly_score?: number;
  ai_explanation?: string;
}

export interface Budget {
  id: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  period: "monthly" | "weekly" | "yearly";
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
  type: "domestic" | "international";
  status: "planning" | "confirmed" | "completed" | "cancelled";
  breakdown: { category: string; amount: number; percentage: number }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
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
  trend: "increasing" | "decreasing" | "stable";
}

export interface MLTransactionAnalysis {
  is_anomaly: boolean;
  anomaly_score: number;
  risk_level: "low" | "medium" | "high";
  explanation: string;
  typical_range: [number, number];
  recommendation?: string;
}

export interface MLFinancialInsight {
  type:
    | "spending_pattern"
    | "budget_alert"
    | "savings_opportunity"
    | "risk_warning";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
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

// ─── Raw shapes returned by the backend ───────────────────────────────────────

/**
 * categories field from GET /api/analytics/ai-dashboard
 * Shape: { income: { [category]: amount }, expenses: { [category]: amount } }
 */
export interface RawCategoryBreakdown {
  income: Record<string, number>;
  expenses: Record<string, number>;
}

/**
 * monthly field — each entry has `expense` (not `expenses`) from the backend
 */
export interface RawMonthlyEntry {
  month: string;
  income: number;
  expense: number; // backend key is `expense`, not `expenses`
  balance: number;
}

/**
 * summary field — backend uses `total_expense` (not `total_expenses`)
 * and does NOT include savings_rate or health_score.
 */
export interface RawSummary {
  total_income: number;
  total_expense: number; // backend key
  balance: number;
  avg_transaction: number;
  transaction_count: number;
}

// ─── Normalised / display shapes used by UI components ────────────────────────

/** A single category row after we normalise the raw object map */
export interface CategoryEntry {
  name: string;
  amount: number;
  percentage: number;
  trend: "up" | "down" | "stable";
  color?: string;
}

/** Monthly entry normalised for charts (expenses key renamed) */
export interface MonthlyEntry {
  month: string;
  income: number;
  expenses: number; // renamed from `expense` for chart compatibility
  savings: number;
}

/** Summary normalised for display */
export interface NormalisedSummary {
  total_income: number;
  total_expenses: number; // renamed from `total_expense`
  balance: number;
  savings_rate: number; // derived: (balance / income) * 100
  health_score: number; // derived or default
  avg_transaction: number;
  transaction_count: number;
}

// AI Dashboard Types
export interface AIDashboardData {
  /** Raw summary from backend (total_expense key) */
  summary: RawSummary;
  /** Raw category breakdown from backend (nested object, NOT array) */
  categories: RawCategoryBreakdown;
  /** Raw monthly data from backend (expense key, not expenses) */
  monthly: RawMonthlyEntry[];
  predicted_next_spending: {
    amount: number;
    /** Decimal 0-1 from backend (e.g. 0.75 = 75%) */
    confidence: number;
    /** May be a label string like "next month" rather than a date */
    date: string;
  } | null;
  recent_transactions: Transaction[];
  ai_flagged_transactions: Array<{
    transaction: Transaction;
    reason: string;
    severity: "low" | "medium" | "high";
  }>;
  /**
   * Backend returns an array of plain strings, NOT MLFinancialInsight objects.
   * Example: ["📈 Spending went up 10%", "💰 Income grew 5%"]
   */
  insights: string[];
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
