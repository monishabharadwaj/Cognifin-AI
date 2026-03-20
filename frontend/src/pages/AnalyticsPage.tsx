import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { SavingsProgressChart } from "@/components/charts/SavingsProgressChart";
import { safeToLocaleString } from "@/utils/format";
import type {
  AIDashboardData,
  RawMonthlyEntry,
  RawCategoryBreakdown,
  MonthlyEntry,
  CategoryEntry,
} from "@/types/finance";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Activity,
} from "lucide-react";

// ─── Data normalisers (same logic as DashboardPage) ─────────────────────────

function normaliseMonthly(raw: RawMonthlyEntry[] | undefined): MonthlyEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => ({
    month: entry.month ?? "",
    income: entry.income ?? 0,
    expenses: entry.expense ?? 0, // backend key is `expense`, chart needs `expenses`
    savings: (entry.income ?? 0) - (entry.expense ?? 0),
  }));
}

function normaliseCategories(
  raw: RawCategoryBreakdown | undefined,
): CategoryEntry[] {
  if (!raw || typeof raw !== "object") return [];

  const expenseMap: Record<string, number> =
    raw.expenses && typeof raw.expenses === "object" ? raw.expenses : {};

  const total = Object.values(expenseMap).reduce((sum, v) => sum + (v || 0), 0);

  return Object.entries(expenseMap)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      trend: "stable" as const,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ─── Health score derivation ─────────────────────────────────────────────────

function deriveHealthScore(data: AIDashboardData) {
  const income = data.summary?.total_income ?? 0;
  const expense = data.summary?.total_expense ?? 0;
  const balance = data.summary?.balance ?? income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      savingsRate > 20 ? 85 : savingsRate > 10 ? 70 : savingsRate > 0 ? 50 : 25,
    ),
  );
  return {
    overallScore,
    savingsRate,
    budgetAdherence: 75,
    emergencyFund: 60,
    debtManagement: 80,
    investmentDiversity: 65,
  };
}

const HEALTH_CATS = [
  { label: "Savings Rate", key: "savingsRate" as const, bar: "bg-green-500" },
  {
    label: "Budget Adherence",
    key: "budgetAdherence" as const,
    bar: "bg-yellow-500",
  },
  {
    label: "Emergency Fund",
    key: "emergencyFund" as const,
    bar: "bg-blue-500",
  },
  {
    label: "Debt Management",
    key: "debtManagement" as const,
    bar: "bg-green-500",
  },
  {
    label: "Investment Diversity",
    key: "investmentDiversity" as const,
    bar: "bg-purple-500",
  },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery<AIDashboardData>({
    queryKey: ["ai-dashboard-analytics"],
    queryFn: () => apiClient.getAIDashboard(),
    refetchInterval: 60_000,
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Activity className="h-12 w-12 text-muted-foreground opacity-30" />
        <p className="text-lg font-semibold">
          {error ? "Failed to load analytics" : "No data available"}
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {error
            ? "Please check your connection and try again."
            : "Start by adding some transactions to see your analytics."}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // ── Normalise ────────────────────────────────────────────────────────────
  const monthly = normaliseMonthly(dashboardData.monthly);
  const categories = normaliseCategories(dashboardData.categories);
  const score = deriveHealthScore(dashboardData);

  const income = dashboardData.summary?.total_income ?? 0;
  const expenses = dashboardData.summary?.total_expense ?? 0;
  const balance = dashboardData.summary?.balance ?? income - expenses;

  // Flagged transactions — handle both flat and wrapped shapes
  const flagged: Array<{
    description: string;
    amount: number;
    date: string;
    reason: string;
  }> = (dashboardData.ai_flagged_transactions ?? [])
    .slice(0, 5)
    .map((f: any) => {
      const tx = f?.transaction ?? f;
      return {
        description: tx?.description ?? "Unknown",
        amount: Number(tx?.amount ?? 0),
        date: tx?.date ?? "",
        reason: f?.reason ?? tx?.ai_explanation ?? "Flagged by AI risk model",
      };
    });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Financial Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-powered overview of your financial health
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Health Score */}
      <Card className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Circle */}
          <div className="relative flex-shrink-0">
            <svg className="w-36 h-36" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="hsl(220 14% 96%)"
                strokeWidth="10"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="hsl(217 91% 60%)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(score.overallScore / 100) * 327} 327`}
                transform="rotate(-90 60 60)"
                initial={{ strokeDasharray: "0 327" }}
                animate={{
                  strokeDasharray: `${(score.overallScore / 100) * 327} 327`,
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold">
                {score.overallScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* Bars */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {HEALTH_CATS.map((cat, i) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="space-y-1.5"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{cat.label}</span>
                  <span className="font-semibold">{score[cat.key]}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${cat.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score[cat.key]}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Income</p>
          <p className="text-xl font-display font-bold text-green-600">
            ₹{safeToLocaleString(income)}
          </p>
          <TrendingUp className="h-4 w-4 text-green-500 mt-1" />
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
          <p className="text-xl font-display font-bold text-red-500">
            ₹{safeToLocaleString(expenses)}
          </p>
          <TrendingDown className="h-4 w-4 text-red-500 mt-1" />
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
          <p
            className={`text-xl font-display font-bold ${balance >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            ₹{safeToLocaleString(balance)}
          </p>
          <PiggyBank className="h-4 w-4 text-blue-500 mt-1" />
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
          <p
            className={`text-xl font-display font-bold ${score.savingsRate >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            {score.savingsRate}%
          </p>
          <Activity className="h-4 w-4 text-primary mt-1" />
        </Card>
      </div>

      {/* Flagged transactions */}
      {flagged.length > 0 && (
        <Card className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            🔴 AI-Flagged Transactions
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {flagged.length}
            </span>
          </h3>
          <div className="space-y-2">
            {flagged.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {f.date && (
                    <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
                      {(() => {
                        try {
                          const d = new Date(f.date);
                          return isNaN(d.getTime())
                            ? "—"
                            : d.toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              });
                        } catch {
                          return "—";
                        }
                      })()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {f.description}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {f.reason}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-600 flex-shrink-0 ml-3">
                  -₹{safeToLocaleString(f.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expense line chart */}
        <Card className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">
            Income vs Expenses Trend
          </h3>
          {monthly.length > 0 ? (
            <IncomeExpenseChart data={monthly} />
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No monthly data available
            </div>
          )}
        </Card>

        {/* Category donut chart */}
        <Card className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Spending by Category</h3>
          {categories.length > 0 ? (
            <CategoryDonutChart data={categories} />
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No category data available
            </div>
          )}
        </Card>

        {/* Savings trend — full width */}
        <Card className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">
            Cash Flow &amp; Savings Trend
          </h3>
          {monthly.length > 0 ? (
            <SavingsProgressChart data={monthly} />
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No savings data available
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
