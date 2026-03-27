import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api";
import { useFinanceStore } from "@/stores/financeStore";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  Brain,
  RefreshCw,
  Activity,
  BarChart3,
  Lightbulb,
  Wallet,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { safeToLocaleString, formatCurrency } from "@/utils/format";
import type { AIDashboardData, CategoryEntry, MonthlyEntry, NormalisedSummary } from "@/types/finance";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AnomalyAlerts } from "@/components/dashboard/AnomalyAlerts";
import { CognifinCube } from "@/components/dashboard/CognifinCube";

// Normalisation helpers
function normaliseCategoryData(raw: AIDashboardData["categories"]): CategoryEntry[] {
  if (!raw || typeof raw !== "object") return [];
  const expenseMap: Record<string, number> = raw.expenses && typeof raw.expenses === "object" ? raw.expenses : {};
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

function normaliseMonthlyData(raw: AIDashboardData["monthly"]): MonthlyEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => ({
    month: entry.month,
    income: entry.income ?? 0,
    expenses: entry.expense ?? 0,
    savings: (entry.income ?? 0) - (entry.expense ?? 0),
  }));
}

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

function normaliseConfidence(confidence: number): number {
  return confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
}

function getInsightIcon(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("spend") || lower.includes("expense") || lower.includes("budget")) return <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />;
  if (lower.includes("income") || lower.includes("salary")) return <TrendingUp className="h-4 w-4 text-success mt-0.5" />;
  if (lower.includes("save") || lower.includes("saving")) return <Wallet className="h-4 w-4 text-primary mt-0.5" />;
  if (lower.includes("predict")) return <Activity className="h-4 w-4 text-purple-500 mt-0.5" />;
  return <Lightbulb className="h-4 w-4 text-primary mt-0.5" />;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<AIDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Zustand fetches for UI widgets
  const { budgets, goals, fetchBudgets, fetchGoals } = useFinanceStore();

  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      setError(null);
      const data = await apiClient.getAIDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
      toast({ title: "Dashboard Error", description: err?.message, variant: "destructive" });
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    fetchBudgets();
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Overview</h1><RefreshCw className="h-5 w-5 animate-spin" /></div>
        <div className="grid grid-cols-4 gap-4"><Card className="h-28 animate-pulse bg-muted/60 rounded-2xl" /><Card className="h-28 animate-pulse bg-muted/60 rounded-2xl" /><Card className="h-28 animate-pulse bg-muted/60 rounded-2xl" /><Card className="h-28 animate-pulse bg-muted/60 rounded-2xl" /></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <p className="text-lg">{error ?? "Dashboard failed to load"}</p>
        <Button onClick={loadDashboardData} className="mt-4">Retry</Button>
      </div>
    );
  }

  const summary = normaliseSummary(dashboardData.summary);
  const categoryEntries = normaliseCategoryData(dashboardData.categories);
  const monthlyEntries = normaliseMonthlyData(dashboardData.monthly);
  const insights: string[] = Array.isArray(dashboardData.insights) ? dashboardData.insights : [];
  const recentTransactions = Array.isArray(dashboardData.recent_transactions) ? dashboardData.recent_transactions : [];
  const prediction = dashboardData.predicted_next_spending ?? null;
  const flaggedTransactions = (Array.isArray(dashboardData.ai_flagged_transactions) ? dashboardData.ai_flagged_transactions : [])
        .filter((t: any) => t.type !== 'income' && t.type !== 'credit');

  return (
    <div className="space-y-6 pb-12 relative">
      
      {/* Premium Dashboard Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 glass-card border-white/[0.05] rounded-[32px] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 to-purple-500/5 pointer-events-none" />
        <CognifinCube />
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center relative shadow-2xl group" 
               style={{ background: "linear-gradient(135deg, #10B981, #8B5CF6)", boxShadow: "0 0 30px rgba(16,185,129,0.3)" }}>
            <div className="absolute inset-0 pulse-glow-emerald opacity-60 rounded-2xl" />
            <Sparkles className="h-8 w-8 text-white relative z-10" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              Financial Overview
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              AI-Curated Wealth Intelligence
            </p>
          </div>
        </div>
        <Button variant="outline" size="lg" onClick={loadDashboardData} className="relative z-10 rounded-xl glass-card border-white/[0.1] hover:bg-white/[0.05] text-white font-bold transition-all px-6">
          <RefreshCw className="h-4 w-4 mr-2" /> REFRESH HUB
        </Button>
      </motion.div>

      {flaggedTransactions.length > 0 && summary.total_expenses > 5000 && <AnomalyAlerts flaggedTransactions={flaggedTransactions} />}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <Card className="p-6 rounded-2xl border-none bg-gradient-to-br from-primary to-purple-700 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500" />
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-xs font-semibold tracking-wider text-white/80 uppercase">Net Balance</p>
                <p className="text-3xl font-display font-bold mt-2 tracking-tight">₹{safeToLocaleString(summary.balance)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><DollarSign className="h-6 w-6 text-white" /></div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 rounded-2xl border border-border/50 shadow-sm bg-card/80 backdrop-blur-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Income</p>
                <p className="text-2xl font-display font-bold mt-2 text-success">₹{safeToLocaleString(summary.total_income)}</p>
              </div>
              <div className="p-3 bg-success/15 rounded-xl"><TrendingUp className="h-5 w-5 text-success" /></div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 rounded-2xl border border-border/50 shadow-sm bg-card/80 backdrop-blur-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Expenses</p>
                <p className="text-2xl font-display font-bold mt-2 text-foreground">₹{safeToLocaleString(summary.total_expenses)}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl"><TrendingDown className="h-5 w-5 text-primary" /></div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-6 rounded-2xl border border-border/50 shadow-sm bg-card/80 backdrop-blur-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Savings Rate</p>
                <p className="text-2xl font-display font-bold mt-2 text-purple-600 dark:text-purple-400">{summary.savings_rate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-500/15 rounded-xl"><Target className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Charts (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="glass-card-charcoal p-8 rounded-[32px] border-white/[0.05]">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white uppercase tracking-tight">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[#10B981]" />
                </div>
                Monthly Cashflow
              </h3>
              <IncomeExpenseChart data={monthlyEntries} />
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="glass-card-charcoal p-8 rounded-[32px] border-white/[0.05]">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white uppercase tracking-tight">
                 <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-[#10B981]" />
                </div>
                Spending by Category
              </h3>
              <CategoryBarChart data={categoryEntries} />
              
              {/* Spending Insights Banner embedded inside the chart card */}
              {categoryEntries.length > 0 && (
                <div className="mt-8 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-4 transition-all hover:bg-white/[0.04]">
                   <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white uppercase tracking-wide">AI Spending Highlight</p>
                     <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                       Your top expense this month is <strong className="text-emerald-400">{categoryEntries[0].name}</strong>, accounting for <strong className="text-emerald-400">{categoryEntries[0].percentage}%</strong> of your total categorized spending.
                     </p>
                   </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Trackers & Insights (1/3 width) */}
        <div className="space-y-8">
          
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
            <Card className="glass-card-charcoal p-8 rounded-[32px] border-white/[0.05]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white uppercase tracking-tight">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-[#10B981]" />
                </div> 
                Goal Progress
              </h3>
              {goals.length === 0 ? (
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-8">No active goals</p>
              ) : (
                <div className="space-y-6">
                  {goals.slice(0,3).map(g => {
                    const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                    return (
                      <div key={g.id} className="group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-bold text-slate-300 group-hover:text-emerald-400 transition-colors flex items-center gap-3">
                            <span className="text-lg">{g.icon}</span> {g.title}
                          </span>
                          <span className="text-xs font-black text-[#10B981]">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.03]">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className={`h-full ${pct >= 100 ? 'bg-emerald-400 neon-strip-emerald' : 'bg-[#10B981]'}`} 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
            <Card className="glass-card-charcoal p-8 rounded-[32px] border-white/[0.05]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white uppercase tracking-tight">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-[#10B981]" />
                </div>
                Budget Usage
              </h3>
              {budgets.length === 0 ? (
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-8">No active budgets</p>
              ) : (
                <div className="space-y-6">
                  {budgets.slice(0,3).map(b => {
                    const pct = Math.min(100, Math.round((b.spentAmount / b.budgetAmount) * 100));
                    const isOver = pct >= 90;
                    return (
                      <div key={b.id} className="group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-bold text-slate-300 group-hover:text-emerald-400 transition-colors flex items-center gap-3">
                            <span className="text-lg">{b.icon}</span> {b.category}
                          </span>
                          <span className={`text-xs font-black ${isOver ? 'text-red-400' : 'text-slate-500'}`}>₹{safeToLocaleString(b.spentAmount)}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.03]">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 1 }}
                            className={`h-full ${isOver ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#10B981]'}`} 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          {/* AI Insights specific card overlay */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
            <Card className="glass-card-charcoal p-8 rounded-[32px] border-white/[0.05] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16" />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white uppercase tracking-tight relative z-10">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center relative">
                   <div className="absolute inset-0 pulse-glow-emerald opacity-50 rounded-lg" />
                   <Brain className="h-4 w-4 text-[#10B981] relative z-10" />
                </div>
                AI Smart Insights
              </h3>
              {insights.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  {insights.slice(0,4).map((insight, idx) => (
                    <div key={idx} className="flex gap-4 text-sm border-b border-white/[0.03] pb-4 last:border-0 last:pb-0 group/insight transition-all">
                      <div className="pt-0.5 group-hover/insight:scale-110 transition-transform">
                        {getInsightIcon(insight)}
                      </div>
                      <span className="text-slate-400 group-hover:text-white transition-colors leading-relaxed font-medium italic">"{insight}"</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-8 relative z-10">Collecting intelligence...</p>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {recentTransactions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
          <RecentTransactions transactions={recentTransactions} />
        </motion.div>
      )}
    </div>
  );
}

