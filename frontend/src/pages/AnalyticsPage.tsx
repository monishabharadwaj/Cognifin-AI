import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  ShieldAlert,
  BarChart,
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
  const expenseRatio = income > 0 ? Math.round((expense / income) * 100) : 0;

  // Check categories for debt and investments
  const expensesCat = (data.categories?.expenses as Record<string, number>) || {};
  
  const debtExpense = 
    (expensesCat.loan || 0) + 
    (expensesCat.emi || 0) + 
    (expensesCat.debt || 0) + 
    (expensesCat.credit || 0);
    
  const debtRatio = income > 0 ? Math.round((debtExpense / income) * 100) : 0;
  const debtManagement = income > 0 ? (debtRatio > 0 ? Math.max(0, 100 - (debtRatio * 2)) : 100) : 0;

  const investment = expensesCat.investment || 0;
  const investmentRatio = expense > 0 ? Math.round((investment / expense) * 100) : 0;
  // Scaled such that 33% of expenses going to investment gives a 100 score
  const investmentDiversity = income > 0 ? Math.min(100, investmentRatio * 3) : 0;

  let overallScore = 0;
  if (income > 0) {
    const savingsScore = savingsRate > 20 ? 85 : savingsRate > 10 ? 70 : savingsRate > 0 ? 50 : 25;
    // Blend savings score with debt and investment health
    overallScore = Math.min(100, Math.max(0, Math.round((savingsScore * 0.6) + (debtManagement * 0.2) + (investmentDiversity * 0.2))));
  }

  return {
    overallScore,
    savingsRate,
    expenseRatio,
    debtManagement,
    investmentDiversity,
  };
}

const HEALTH_CATS = [
  { label: "Savings Rate", key: "savingsRate" as const, color: "text-success", bg: "bg-success/20", bar: "bg-success" },
  { label: "Expense Ratio", key: "expenseRatio" as const, color: "text-destructive", bg: "bg-destructive/20", bar: "bg-destructive" },
  { label: "Debt Management", key: "debtManagement" as const, color: "text-warning", bg: "bg-warning/20", bar: "bg-warning" },
  { label: "Investment Score", key: "investmentDiversity" as const, color: "text-indigo-500", bg: "bg-indigo-500/20", bar: "bg-indigo-500" },
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
      <div className="space-y-6 pb-12">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !dashboardData) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 gap-4 bg-card/40 border border-dashed border-border rounded-3xl mt-6">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
          <Activity className="h-10 w-10 text-muted-foreground opacity-50" />
        </div>
        <p className="text-xl font-display font-bold">Analytics Unavailable</p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {error
            ? "We encountered an issue fetching your insights. Please try again."
            : "Start by logging transactions to populate your analytics dashboard."}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      </motion.div>
    );
  }

  // ── Normalise ────────────────────────────────────────────────────────────
  const monthly = normaliseMonthly(dashboardData.monthly);
  const categories = normaliseCategories(dashboardData.categories);
  const score = deriveHealthScore(dashboardData);

  const income = dashboardData.summary?.total_income ?? 0;
  const expenses = dashboardData.summary?.total_expense ?? 0;
  const balance = dashboardData.summary?.balance ?? income - expenses;

  // Flagged transactions
  const flagged: Array<{
    description: string;
    amount: number;
    date: string;
    reason: string;
  }> = (dashboardData.ai_flagged_transactions ?? [])
    .filter((f: any) => {
      const tx = f?.transaction ?? f;
      return tx?.type !== 'income' && tx?.type !== 'credit';
    })
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
    <div className="space-y-6 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border/50 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <BarChart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Financial Intelligence</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-powered insights &amp; behavioral analysis
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="relative z-10 flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-muted/50 border border-border/50 rounded-lg hover:bg-muted transition-colors text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Data
        </button>
      </div>

      {/* Health Score Panel */}
      <Card className="p-0 border border-border/50 rounded-2xl overflow-hidden bg-card/80 backdrop-blur-lg">
        <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-border/40">
          
          {/* Main Score - Left */}
          <div className="flex flex-col items-center justify-center p-8 lg:px-12 w-full md:w-auto shrink-0 relative">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-center mb-6 w-full absolute top-6">FinHealth Index</h3>
            <div className="relative flex-shrink-0 mt-8 mb-4">
              <svg className="w-40 h-40" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="12" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#healthGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(score.overallScore / 100) * 327} 327`}
                  transform="rotate(-90 60 60)"
                  initial={{ strokeDasharray: "0 327" }}
                  animate={{ strokeDasharray: `${(score.overallScore / 100) * 327} 327` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--secondary-foreground))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-display font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary to-purple-600">
                  {score.overallScore}
                </span>
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">Out of 100 points</p>
          </div>

          {/* Breakdown Bars - Right */}
          <div className="flex-1 p-6 md:p-8 w-full bg-muted/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {HEALTH_CATS.map((cat, i) => (
                <motion.div key={cat.key} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="space-y-2.5">
                  <div className="flex justify-between text-sm items-end">
                    <span className="font-semibold text-muted-foreground">{cat.label}</span>
                    <span className={`font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground`}>{score[cat.key]}<span className="text-xs">%</span></span>
                  </div>
                  <div className={`h-2.5 rounded-full ${cat.bg} overflow-hidden border border-border/20 relative`}>
                    <motion.div
                      className={`absolute top-0 left-0 h-full rounded-full ${cat.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${score[cat.key]}%` }}
                      transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick stats KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Income", value: income, icon: TrendingUp, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
          { label: "Total Expenses", value: expenses, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
          { label: "Net Balance", value: balance, icon: PiggyBank, color: balance >= 0 ? "text-primary" : "text-destructive", bg: balance >= 0 ? "bg-primary/10" : "bg-destructive/10", border: balance >= 0 ? "border-primary/20" : "border-destructive/20" },
          { label: "Savings Rate", value: score.savingsRate, isPercent: true, icon: Activity, color: score.savingsRate >= 0 ? "text-indigo-500" : "text-warning", bg: score.savingsRate >= 0 ? "bg-indigo-500/10" : "bg-warning/10", border: score.savingsRate >= 0 ? "border-indigo-500/20" : "border-warning/20" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.3 }}>
            <Card className="p-5 border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-70 ${stat.bg}`} />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{stat.label}</p>
                <div className={`p-1.5 rounded-lg border ${stat.bg} ${stat.border}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-2xl lg:text-3xl font-display font-bold tracking-tight mb-1 relative z-10 ${stat.color}`}>
                {stat.isPercent ? `${stat.value}%` : `₹${safeToLocaleString(stat.value)}`}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Flagged transactions */}
      <AnimatePresence>
        {flagged.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-0 border border-destructive/30 rounded-2xl overflow-hidden bg-destructive/5 shadow-sm">
              <div className="bg-destructive/10 px-5 py-3 border-b border-destructive/20 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                <h3 className="font-bold text-destructive">Risk Radar: Flagged Transactions</h3>
                <span className="ml-auto text-xs font-bold bg-destructive text-white px-2 py-0.5 rounded-full shadow-sm">
                  {flagged.length} Warnings
                </span>
              </div>
              <div className="divide-y divide-destructive/10">
                {flagged.map((f, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-destructive/5 transition-colors gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive font-bold text-xs uppercase text-center leading-tight">
                        {(() => {
                          try {
                            const d = new Date(f.date);
                            return isNaN(d.getTime()) ? "—" : `${d.getDate()}\n${d.toLocaleString('default', { month: 'short' })}`;
                          } catch { return "—"; }
                        })()}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-bold text-foreground truncate">{f.description}</p>
                        <p className="text-xs font-medium text-destructive mt-0.5 max-w-sm lg:max-w-md xl:max-w-xl truncate">
                          <span className="uppercase tracking-wider mr-1 opacity-70">Reason:</span> {f.reason}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="text-lg font-display font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-lg inline-block">
                        -₹{safeToLocaleString(f.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
