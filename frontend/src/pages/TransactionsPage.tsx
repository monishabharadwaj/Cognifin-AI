import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFinanceStore } from "@/stores/financeStore";
import { RiskBadge } from "@/components/ui/RiskBadge";

import { Plus, Search, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { safeToLocaleString } from "@/utils/format";

const categories = [
  "Food",
  "Salary",
  "Entertainment",
  "Transport",
  "Dining",
  "Freelance",
  "Utilities",
  "Shopping",
  "Health",
  "Investment",
];

export default function TransactionsPage() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    fetchTransactions,
    isLoading,
    error,
  } = useFinanceStore();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const todayISO = new Date().toISOString().slice(0, 10); // "yyyy-MM-dd" without date-fns
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "Food",
    type: "expense" as "income" | "expense",
    date: todayISO,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = transactions.filter((t) => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterRisk !== "all" && t.ai_risk_level !== filterRisk) return false;
    return true;
  });

  const handleAdd = async () => {
    if (!form.description || !form.amount) return;
    setIsSubmitting(true);
    try {
      await addTransaction({
        description: form.description,
        amount: Number(form.amount),
        category: form.category,
        type: form.type,
        date: form.date,
      });
      setForm({
        description: "",
        amount: "",
        category: "Food",
        type: "expense",
        date: new Date().toISOString().slice(0, 10),
      });
      setOpen(false);
      toast({ title: "Transaction added successfully ✅" });
    } catch (err: any) {
      toast({
        title: "Failed to add transaction",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast({ title: "Transaction deleted 🗑️" });
    } catch (err: any) {
      toast({
        title: "Failed to delete transaction",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  // Normalise to lowercase so "HIGH" from DB matches "high"
  const highRiskCount = transactions.filter(
    (t) => t.ai_risk_level?.toLowerCase() === "high",
  ).length;
  const mediumRiskCount = transactions.filter(
    (t) => t.ai_risk_level?.toLowerCase() === "medium",
  ).length;

  /**
   * Safely format a date string to "dd MMM" without date-fns parseISO.
   * Returns "—" for null / undefined / invalid dates.
   */
  function safeDateFormat(raw: string | null | undefined): string {
    if (!raw) return "—";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    } catch {
      return "—";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Transactions</h1>
          {(highRiskCount > 0 || mediumRiskCount > 0) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              {highRiskCount > 0 && (
                <span className="text-destructive font-medium">
                  {highRiskCount} high-risk
                </span>
              )}
              {highRiskCount > 0 && mediumRiskCount > 0 && " · "}
              {mediumRiskCount > 0 && (
                <span className="text-warning font-medium">
                  {mediumRiskCount} medium-risk
                </span>
              )}{" "}
              transactions detected
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTransactions()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Add Transaction
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant={form.type === "income" ? "default" : "outline"}
                    className={
                      form.type === "income"
                        ? "gradient-success text-primary-foreground"
                        : ""
                    }
                    size="sm"
                    onClick={() => setForm({ ...form, type: "income" })}
                  >
                    Income
                  </Button>
                  <Button
                    variant={form.type === "expense" ? "default" : "outline"}
                    className={
                      form.type === "expense"
                        ? "gradient-warning text-primary-foreground"
                        : ""
                    }
                    size="sm"
                    onClick={() => setForm({ ...form, type: "expense" })}
                  >
                    Expense
                  </Button>
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="e.g. Grocery Store"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleAdd}
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Save Transaction"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-0"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 bg-secondary border-0">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 bg-secondary border-0">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-36 bg-secondary border-0">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="high">🔴 High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* List */}
      <Card className="glass-card overflow-hidden">
        <div className="divide-y">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <div
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors ${t.ai_risk_level?.toLowerCase() === "high" ? "bg-destructive/5 border-l-2 border-l-destructive" : t.ai_risk_level?.toLowerCase() === "medium" ? "bg-warning/5 border-l-2 border-l-warning" : ""}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {safeDateFormat(t.date)}
                  </span>
                  <span className="text-sm truncate">{t.description}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground hidden sm:inline">
                    {t.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <RiskBadge
                    level={t.ai_risk_level}
                    score={t.anomaly_score}
                    explanation={t.ai_explanation}
                    compact
                  />
                  <span
                    className={`text-sm font-semibold tabular-nums ${t.type === "income" ? "text-success" : "text-destructive"}`}
                  >
                    {t.type === "income" ? "+" : "-"}₹
                    {safeToLocaleString(t.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(t.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {t.ai_risk_level?.toLowerCase() === "high" &&
                t.ai_explanation && (
                  <div className="px-5 pb-3 flex items-center gap-2 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    <span>AI: {t.ai_explanation}</span>
                  </div>
                )}
            </motion.div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              {error ? `Error: ${error}` : "No transactions found"}
            </div>
          )}
          {isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading transactions...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
