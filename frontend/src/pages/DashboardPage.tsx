import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  Brain,
  RefreshCw,
  Lightbulb,
  Activity,
  BarChart3,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  safeToLocaleString,
  safeToFixed,
  formatCurrency,
} from "@/utils/format";
import type {
  AIDashboardData,
  CategoryEntry,
  MonthlyEntry,
  NormalisedSummary,
} from "@/types/finance";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AnomalyAlerts } from "@/components/dashboard/AnomalyAlerts";

// ─── Normalisation helpers ────────────────────────────────────────────────────

/**
 * Backend returns categories as:
 *   { income: { salary: 50000, freelance: 10000 },
 *     expenses: { food: 3000, transport: 1200 } }
 *
 * We convert the EXPENSES object into a sorted array for the chart.
 */
function normaliseCategoryData(
  raw: AIDashboardData["categories"],
): CategoryEntry[] {
  if (!raw || typeof raw !== "object") return [];

  const expenseMap: Record<string, number> =
    raw.expenses && typeof raw.expenses === "object" ? raw.expenses : {};

  const total = Object.values(expenseMap).reduce((sum, v) => sum + (v || 0), 0);

  const entries: CategoryEntry[] = Object.entries(expenseMap)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // capitalise
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      trend: "stable" as const,
    }))
    .sort((a, b) => b.amount - a.amount); // highest first

  return entries;
}

/**
 * Backend monthly entry uses `expense` key; chart expects `expenses`.
 * Also derive `savings` = income - expense.
 */
function normaliseMonthlyData(raw: AIDashboardData["monthly"]): MonthlyEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => ({
    month: entry.month,
    income: entry.income ?? 0,
    expenses: entry.expense ?? 0, // key rename
    savings: (entry.income ?? 0) - (entry.expense ?? 0),
  }));
}

/**
 * Backend summary uses `total_expense`; UI expects `total_expenses`.
 * Derive savings_rate and health_score if missing.
 */
function normaliseSummary(raw: AIDashboardData["summary"]): NormalisedSummary {
  const income = raw?.total_income ?? 0;
  const expense = raw?.total_expense ?? 0;
  const balance = raw?.balance ?? income - expense;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  return {
    total_income: income,
    total_expenses: expense,
    balance,
    savings_rate: savingsRate,
    health_score: savingsRate >= 20 ? 80 : savingsRate >= 10 ? 60 : 40,
    avg_transaction: raw?.avg_transaction ?? 0,
    transaction_count: raw?.transaction_count ?? 0,
  };
}

/**
 * Backend confidence is a decimal 0–1 (e.g. 0.75).
 * Display as percentage 0–100.
 */
function normaliseConfidence(confidence: number): number {
  // If someone already sent 0–100 keep it; otherwise multiply
  return confidence <= 1
    ? Math.round(confidence * 100)
    : Math.round(confidence);
}

// ─── Insight icon helper ──────────────────────────────────────────────────────

function getInsightIcon(text: string) {
  const lower = text.toLowerCase();
  if (
    lower.includes("spend") ||
    lower.includes("expense") ||
    lower.includes("budget")
  )
    return (
      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
    );
  if (
    lower.includes("income") ||
    lower.includes("salary") ||
    lower.includes("earn")
  )
    return <TrendingUp className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />;
  if (lower.includes("save") || lower.includes("saving"))
    return <Wallet className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />;
  if (lower.includes("predict") || lower.includes("next month"))
    return (
      <Activity className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
    );
  return <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />;
}

function getInsightStyle(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes("over budget") ||
    lower.includes("went up") ||
    lower.includes("high") ||
    lower.includes("🚨")
  )
    return "border-destructive/30 bg-destructive/5";
  if (
    lower.includes("watch") ||
    lower.includes("almost") ||
    lower.includes("⚠️") ||
    lower.includes("📈")
  )
    return "border-warning/30 bg-warning/5";
  if (
    lower.includes("awesome") ||
    lower.includes("great") ||
    lower.includes("down") ||
    lower.includes("🎉") ||
    lower.includes("✅")
  )
    return "border-success/30 bg-success/5";
  return "border-border bg-muted/30";
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="glass-card p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-7 bg-muted rounded w-1/2" />
      </div>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<AIDashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data: AIDashboardData = await apiClient.getAIDashboard();

      console.log("✅ Dashboard raw data:", data);
      console.log("  insights:", data.insights);
      console.log("  categories:", data.categories);
      console.log("  predicted_next_spending:", data.predicted_next_spending);
      console.log("  monthly:", data.monthly);

      setDashboardData(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to load dashboard";
      setError(msg);
      toast({
        title: "Dashboard Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">
            Financial Dashboard
          </h1>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading…
          </Button>
        </div>

        {/* Summary skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Body skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card p-6 h-64 animate-pulse">
            <div className="h-full bg-muted rounded" />
          </Card>
          <Card className="glass-card p-6 h-64 animate-pulse">
            <div className="h-full bg-muted rounded" />
          </Card>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">
            Financial Dashboard
          </h1>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="glass-card p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Unable to load dashboard
          </h3>
          <p className="text-muted-foreground mb-4">
            {error ?? "No data available"}
          </p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </Card>
      </div>
    );
  }

  // ── Normalise raw API response ─────────────────────────────────────────────
  const summary = normaliseSummary(dashboardData.summary);
  const categoryEntries = normaliseCategoryData(dashboardData.categories);
  const monthlyEntries = normaliseMonthlyData(dashboardData.monthly);
  const prediction = dashboardData.predicted_next_spending ?? null;
  const insights: string[] = Array.isArray(dashboardData.insights)
    ? dashboardData.insights
    : [];
  const recentTransactions = Array.isArray(dashboardData.recent_transactions)
    ? dashboardData.recent_transactions
    : [];
  const flaggedTransactions = Array.isArray(
    dashboardData.ai_flagged_transactions,
  )
    ? dashboardData.ai_flagged_transactions
    : [];

  const confidencePct = prediction
    ? normaliseConfidence(prediction.confidence)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Financial Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered insights &amp; analytics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* ── Anomaly alerts (full-width, at top) ── */}
      {flaggedTransactions.length > 0 && (
        <AnomalyAlerts flaggedTransactions={flaggedTransactions} />
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">
                  ₹{safeToLocaleString(summary.total_income)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  ₹{safeToLocaleString(summary.total_expenses)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    summary.balance >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  ₹{safeToLocaleString(summary.balance)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className="text-2xl font-bold">
                  {safeToFixed(summary.savings_rate)}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Category chart + AI Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Donut Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Spending by Category
            </h3>

            {categoryEntries.length > 0 ? (
              <CategoryDonutChart data={categoryEntries} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  No expense categories found. Add some transactions to see
                  spending breakdown.
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Insights
              {insights.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">
                  {insights.length}
                </span>
              )}
            </h3>

            {insights.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${getInsightStyle(
                      insight,
                    )}`}
                  >
                    {getInsightIcon(insight)}
                    <p className="text-sm leading-relaxed">{insight}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  No AI insights available yet. Add more transactions so our AI
                  can start analysing your spending patterns.
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── Predicted Spending ── */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              AI Prediction — Next Month
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Amount */}
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                  Predicted Spending
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(prediction.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {prediction.date && prediction.date !== "next month"
                    ? (() => {
                        try {
                          return new Date(prediction.date).toLocaleDateString(
                            "en-IN",
                            { month: "long", year: "numeric" },
                          );
                        } catch {
                          return prediction.date;
                        }
                      })()
                    : "Next Month"}
                </p>
              </div>

              {/* Confidence bar */}
              <div className="flex flex-col justify-center p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                  Confidence
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        confidencePct >= 80
                          ? "bg-success"
                          : confidencePct >= 60
                            ? "bg-warning"
                            : "bg-destructive"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${confidencePct}%` }}
                      transition={{ duration: 0.8, delay: 0.9 }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      confidencePct >= 80
                        ? "text-success"
                        : confidencePct >= 60
                          ? "text-warning"
                          : "text-destructive"
                    }`}
                  >
                    {confidencePct}%
                  </span>
                </div>
                <Badge
                  className="mt-2 w-fit"
                  variant={
                    confidencePct >= 80
                      ? "default"
                      : confidencePct >= 60
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {confidencePct >= 80
                    ? "High confidence"
                    : confidencePct >= 60
                      ? "Medium confidence"
                      : "Low confidence"}
                </Badge>
              </div>

              {/* Context */}
              <div className="flex flex-col justify-center p-4 rounded-xl bg-muted/20 border border-border">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                  vs. This Month
                </p>
                {summary.total_expenses > 0 ? (
                  (() => {
                    const diff = prediction.amount - summary.total_expenses;
                    const pct = Math.abs(
                      (diff / summary.total_expenses) * 100,
                    ).toFixed(1);
                    const isMore = diff > 0;
                    return (
                      <>
                        <p
                          className={`text-2xl font-bold ${
                            isMore ? "text-destructive" : "text-success"
                          }`}
                        >
                          {isMore ? "+" : "-"}₹
                          {safeToLocaleString(Math.abs(diff))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isMore ? "▲" : "▼"} {pct}%{" "}
                          {isMore ? "more than" : "less than"} current month
                        </p>
                      </>
                    );
                  })()
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No current-month data to compare.
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              🤖 This prediction is generated by our ML model based on your
              historical spending patterns. Actual amounts may vary.
            </p>
          </Card>
        </motion.div>
      )}

      {/* ── Income vs Expense trend chart ── */}
      {monthlyEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Income vs Expenses
            </h3>
            <IncomeExpenseChart data={monthlyEntries} />
          </Card>
        </motion.div>
      )}

      {/* ── Recent Transactions ── */}
      {recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <RecentTransactions transactions={recentTransactions} />
        </motion.div>
      )}
    </div>
  );
}
