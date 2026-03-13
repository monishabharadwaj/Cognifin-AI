import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useFinanceStore } from "@/stores/financeStore";
import { mockHealthScore, monthlyData, categoryData } from "@/data/mockData";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { SavingsProgressChart } from "@/components/charts/SavingsProgressChart";
import { RiskBadge } from "@/components/ui/RiskBadge";

const healthCategories = [
  { label: "Savings Rate", key: "savingsRate" as const, color: "gradient-success" },
  { label: "Budget Adherence", key: "budgetAdherence" as const, color: "gradient-warning" },
  { label: "Emergency Fund", key: "emergencyFund" as const, color: "gradient-primary" },
  { label: "Debt Management", key: "debtManagement" as const, color: "gradient-success" },
  { label: "Investment Diversity", key: "investmentDiversity" as const, color: "gradient-purple" },
];

export default function AnalyticsPage() {
  const { transactions, budgets, goals } = useFinanceStore();
  const score = mockHealthScore;

  const highRisk = transactions.filter(t => t.ai_risk_level === 'high');
  const mediumRisk = transactions.filter(t => t.ai_risk_level === 'medium');
  const overBudget = budgets.filter(b => b.spentAmount > b.budgetAmount);
  const goalProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + (g.currentAmount / g.targetAmount) * 100, 0) / goals.length) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Financial Analytics</h1>

      {/* Health Score */}
      <Card className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <svg className="w-36 h-36" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(220 14% 96%)" strokeWidth="10" />
              <motion.circle
                cx="60" cy="60" r="52" fill="none" stroke="hsl(217 91% 60%)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={`${(score.overallScore / 100) * 327} 327`}
                transform="rotate(-90 60 60)"
                initial={{ strokeDasharray: "0 327" }}
                animate={{ strokeDasharray: `${(score.overallScore / 100) * 327} 327` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold">{score.overallScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {healthCategories.map((cat, i) => (
              <motion.div key={cat.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{cat.label}</span>
                  <span className="font-semibold">{score[cat.key]}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div className={`h-full rounded-full ${cat.color}`} initial={{ width: 0 }} animate={{ width: `${score[cat.key]}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Risk Alerts</p>
          <p className="text-2xl font-display font-bold text-destructive">{highRisk.length}</p>
          <p className="text-xs text-muted-foreground">high-risk transactions</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Warnings</p>
          <p className="text-2xl font-display font-bold text-warning">{mediumRisk.length}</p>
          <p className="text-xs text-muted-foreground">medium-risk transactions</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Over Budget</p>
          <p className="text-2xl font-display font-bold text-destructive">{overBudget.length}</p>
          <p className="text-xs text-muted-foreground">categories exceeded</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Goal Progress</p>
          <p className="text-2xl font-display font-bold text-primary">{goalProgress}%</p>
          <p className="text-xs text-muted-foreground">average completion</p>
        </Card>
      </div>

      {/* Risk Assessment */}
      {highRisk.length > 0 && (
        <Card className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3">🔴 High-Risk Transactions</h3>
          <div className="space-y-2">
            {highRisk.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{t.date}</span>
                  <span className="text-sm font-medium">{t.description}</span>
                  <RiskBadge level={t.ai_risk_level} score={t.anomaly_score} explanation={t.ai_explanation} />
                </div>
                <span className="text-sm font-semibold text-destructive">-₹{t.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Income Trend (6 Months)</h3>
          <IncomeExpenseChart data={monthlyData} />
        </Card>
        <Card className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Category Distribution</h3>
          <CategoryDonutChart data={categoryData} />
        </Card>
        <Card className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Cash Flow & Savings Trend</h3>
          <SavingsProgressChart data={monthlyData} />
        </Card>
      </div>
    </div>
  );
}
