import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

import { Plus, Search, Trash2, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
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

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  salary: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  entertainment: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  transport: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  dining: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  freelance: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  utilities: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  shopping: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  health: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  investment: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  rent: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  education: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  travel: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
};

function getCategoryColor(raw: string | null | undefined): string {
  if (!raw) return "bg-muted text-muted-foreground border-border";
  const key = raw.toLowerCase().trim();
  return CATEGORY_COLORS[key] ?? "bg-muted text-muted-foreground border-border";
}

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
  const todayISO = new Date().toISOString().slice(0, 10);
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

  const highRiskCount = transactions.filter(
    (t) => t.ai_risk_level?.toLowerCase() === "high",
  ).length;
  const mediumRiskCount = transactions.filter(
    (t) => t.ai_risk_level?.toLowerCase() === "medium",
  ).length;

  function safeDateFormat(raw: string | null | undefined): string {
    if (!raw) return "—";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border/50 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Transactions</h1>
            {(highRiskCount > 0 || mediumRiskCount > 0) ? (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {highRiskCount > 0 && <span className="text-destructive font-medium">{highRiskCount} high-risk</span>}
                {highRiskCount > 0 && mediumRiskCount > 0 && " · "}
                {mediumRiskCount > 0 && <span className="text-warning font-medium">{mediumRiskCount} medium-risk</span>} detected
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">Manage and track your financial activity</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
          <Button variant="outline" size="sm" onClick={() => fetchTransactions()} disabled={isLoading} className="rounded-full shadow-sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-md bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all text-white">
                <Plus className="h-4 w-4 mr-2" /> New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Add Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex p-1 bg-muted/50 rounded-xl">
                  <Button
                    variant={form.type === "income" ? "default" : "ghost"}
                    className={`flex-1 rounded-lg transition-all ${form.type === "income" ? "bg-success hover:bg-success/90 text-white shadow-sm" : "hover:bg-background/50"}`}
                    size="sm"
                    onClick={() => setForm({ ...form, type: "income" })}
                  >
                    Income
                  </Button>
                  <Button
                    variant={form.type === "expense" ? "default" : "ghost"}
                    className={`flex-1 rounded-lg transition-all ${form.type === "expense" ? "bg-primary hover:bg-primary/90 text-white shadow-sm" : "hover:bg-background/50"}`}
                    size="sm"
                    onClick={() => setForm({ ...form, type: "expense" })}
                  >
                    Expense
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="text-lg font-medium h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Grocery Store" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-10 rounded-lg" />
                </div>
                <Button onClick={handleAdd} className="w-full h-12 text-md mt-2 rounded-xl font-bold bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all" disabled={isSubmitting}>
                  {isSubmitting ? <span className="animate-pulse">Processing...</span> : "Save Transaction"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-2 border border-border/50 bg-card/60 backdrop-blur-xl shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 p-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/40 border-transparent hover:border-border focus:border-primary transition-colors h-10 rounded-xl"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] bg-muted/40 border-transparent h-10 rounded-xl flex-shrink-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] bg-muted/40 border-transparent h-10 rounded-xl flex-shrink-0">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-[140px] bg-muted/40 border-transparent h-10 rounded-xl flex-shrink-0 flex items-center">
                <Filter className="w-3 h-3 mr-2 opacity-50" />
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="rounded-2xl border border-border/50 shadow-sm bg-card/80 backdrop-blur-lg overflow-hidden min-h-[400px]">
        <div className="divide-y divide-border/40">
          <AnimatePresence mode="popLayout">
            {filtered.map((t, i) => {
              const isPositive = t.type === "income" || (t.type as string) === "credit";
              const showHighRisk = !isPositive && t.ai_risk_level?.toLowerCase() === "high";
              const showMediumRisk = !isPositive && t.ai_risk_level?.toLowerCase() === "medium";
              
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ delay: Math.min(i * 0.05, 0.5) }}
                  className={[
                    "flex flex-col px-6 py-4 hover:bg-muted/30 transition-colors group",
                    showHighRisk ? "bg-destructive/5 border-l-2 border-l-destructive" : "",
                    showMediumRisk ? "bg-warning/5 border-l-2 border-l-warning" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={[
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        isPositive ? "bg-success/10 border-success/20 text-success" : "bg-primary/10 border-primary/20 text-primary"
                      ].join(" ")}>
                        {isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors">
                          {t.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                            {safeDateFormat(t.date)}
                          </span>
                          <span className="text-muted-foreground/30 text-[10px]">•</span>
                          <span className={[
                            "inline-block text-[10px] font-medium px-2 py-0.5 rounded-md border",
                            getCategoryColor(t.category),
                          ].join(" ")}>
                            {t.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      {!isPositive && (
                        <div className="scale-90 origin-right">
                          <RiskBadge level={t.ai_risk_level} score={t.anomaly_score} explanation={t.ai_explanation} compact />
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <span className={`text-[15px] font-bold tabular-nums whitespace-nowrap ${isPositive ? "text-success" : "text-foreground"}`}>
                          {isPositive ? "+" : "-"}₹{safeToLocaleString(t.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                          onClick={() => handleDelete(t.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Explanation expand area if needed */}
                  {showHighRisk && t.ai_explanation && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 ml-14 flex items-start gap-2 text-xs text-destructive bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">AI Alert: {t.ai_explanation}</span>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          {filtered.length === 0 && !isLoading && (
            <div className="p-16 text-center text-muted-foreground">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/50" />
              </div>
              <p className="text-base font-semibold text-foreground">{error ? `Error: ${error}` : "No transactions found"}</p>
              <p className="text-sm mt-1">Try adjusting your filters or add a new transaction.</p>
            </div>
          )}
          {isLoading && (
            <div className="p-16 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="font-medium animate-pulse">Loading financial data...</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
