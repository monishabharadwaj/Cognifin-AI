import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Brain, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFinanceStore } from "@/stores/financeStore";
import { apiClient } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { BudgetUtilizationChart } from "@/components/charts/BudgetUtilizationChart";
import { SavingsProgressChart } from "@/components/charts/SavingsProgressChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { PredictedSpending } from "@/components/dashboard/PredictedSpending";
import { AnomalyAlerts } from "@/components/dashboard/AnomalyAlerts";
import { format, parseISO } from "date-fns";
import type { AIDashboardData } from "@/types/finance";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export default function DashboardPage() {
  const { transactions, budgets } = useFinanceStore();

  // Fetch AI Dashboard data
  const { data: dashboardData, isLoading, error } = useQuery<AIDashboardData>({
    queryKey: ['ai-dashboard'],
    queryFn: () => apiClient.getAIDashboard(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fallback to store data if API data is not available
  const summary = dashboardData?.summary || {
    total_income: transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    total_expenses: transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    balance: transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) - 
             transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    savings_rate: 0,
    health_score: 82,
  };

  const summaryCards = [
    { 
      title: "Total Income", 
      value: formatCurrency(summary.total_income), 
      change: "+8.2%", 
      up: true, 
      icon: TrendingUp, 
      gradient: "gradient-success" 
    },
    { 
      title: "Total Expenses", 
      value: formatCurrency(summary.total_expenses), 
      change: "-3.1%", 
      up: false, 
      icon: TrendingDown, 
      gradient: "gradient-warning" 
    },
    { 
      title: "Current Balance", 
      value: formatCurrency(summary.balance), 
      change: "+12.5%", 
      up: true, 
      icon: Wallet, 
      gradient: "gradient-primary" 
    },
    { 
      title: "Health Score", 
      value: `${summary.health_score}/100`, 
      change: "+2%", 
      up: true, 
      icon: Brain, 
      gradient: "gradient-purple" 
    },
  ];

  if (error) {
    console.error('Dashboard data fetch error:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Welcome back! 👋</h1>
        <p className="text-muted-foreground mt-1">
          Your financial health score: <span className="font-semibold text-primary">{summary.health_score}/100</span> 📈
        </p>
      </div>

      {/* Summary Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <motion.div key={card.title} variants={item}>
            <Card className="p-5 glass-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-display font-bold mt-1">{card.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {card.up ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className={`text-xs font-medium ${card.up ? "text-success" : "text-destructive"}`}>
                      {card.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className={`h-10 w-10 rounded-xl ${card.gradient} flex items-center justify-center`}>
                  <card.icon className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* AI Insights Section */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AIInsights insights={dashboardData.insights} />
          </div>
          <div>
            <PredictedSpending prediction={dashboardData.predicted_next_spending} />
          </div>
        </div>
      )}

      {/* Anomaly Alerts */}
      {dashboardData?.ai_flagged_transactions && dashboardData.ai_flagged_transactions.length > 0 && (
        <AnomalyAlerts flaggedTransactions={dashboardData.ai_flagged_transactions} />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 glass-card">
          <h3 className="text-sm font-semibold mb-4">Income vs Expenses</h3>
          <IncomeExpenseChart data={dashboardData?.monthly || []} />
        </Card>
        <Card className="p-5 glass-card">
          <h3 className="text-sm font-semibold mb-4">Spending by Category</h3>
          <CategoryDonutChart data={dashboardData?.categories || []} />
        </Card>
        <Card className="p-5 glass-card">
          <h3 className="text-sm font-semibold mb-4">Budget Utilization</h3>
          <BudgetUtilizationChart budgets={budgets} />
        </Card>
        <Card className="p-5 glass-card">
          <h3 className="text-sm font-semibold mb-4">Savings Trend</h3>
          <SavingsProgressChart data={dashboardData?.monthly || []} />
        </Card>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={dashboardData?.recent_transactions?.slice(0, 5) || transactions.slice(0, 5)} />
    </div>
  );
}
