import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useFinanceStore } from "@/stores/financeStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pencil, Plus, RefreshCw, AlertTriangle, Target, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { safeToLocaleString } from "@/utils/format";

const icons = ['🍕', '🚗', '🎬', '🛍️', '💡', '🏥', '📚', '🏠', '💳', '✈️', '🐶', '☕'];

export default function BudgetPage() {
  const { budgets, addBudget, deleteBudget, updateBudget, fetchBudgets, isLoading, error } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ category: '', budgetAmount: '', period: 'monthly' as 'monthly' | 'weekly' | 'yearly', icon: '🍕' });
  const { toast } = useToast();

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const totalBudget = budgets.reduce((s, b) => s + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
  const overBudgetCount = budgets.filter(b => b.spentAmount > b.budgetAmount).length;

  const handleSave = async () => {
    if (!form.category || !form.budgetAmount) return;
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateBudget({ id: editId, category: form.category, budgetAmount: Number(form.budgetAmount), spentAmount: budgets.find(b => b.id === editId)?.spentAmount || 0, period: form.period, icon: form.icon });
        toast({ title: "Budget updated ✅" });
      } else {
        await addBudget({ category: form.category, budgetAmount: Number(form.budgetAmount), spentAmount: 0, period: form.period, icon: form.icon });
        toast({ title: "Budget created ✅" });
      }
      setForm({ category: '', budgetAmount: '', period: 'monthly', icon: '🍕' });
      setEditId(null);
      setOpen(false);
    } catch (err: any) {
      toast({ 
        title: `Failed to ${editId ? 'update' : 'create'} budget`, 
        description: err.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (b: typeof budgets[0]) => {
    setEditId(b.id);
    setForm({ category: b.category, budgetAmount: b.budgetAmount.toString(), period: b.period, icon: b.icon });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      toast({ title: "Budget deleted 🗑️" });
    } catch (err: any) {
      toast({ 
        title: "Failed to delete budget", 
        description: err.message || "Please try again", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border/50 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <PieChart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Active Budgets</h1>
            <div className="text-sm font-medium mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Total Managed:</span>
              <span className="text-foreground border px-2 py-0.5 rounded-md">₹{safeToLocaleString(totalSpent)} / ₹{safeToLocaleString(totalBudget)}</span>
              {overBudgetCount > 0 && (
                <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full flex items-center shadow-sm">
                  <AlertTriangle className="w-3 h-3 mr-1" /> {overBudgetCount} exceeded
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 relative z-10">
          <Button variant="outline" size="sm" onClick={() => fetchBudgets()} disabled={isLoading} className="rounded-full shadow-sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ category: '', budgetAmount: '', period: 'monthly', icon: '🍕' }); } }}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-md bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all text-white">
                <Plus className="h-4 w-4 mr-2" /> New Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader><DialogTitle className="font-display text-xl">{editId ? 'Edit' : 'Create'} Budget</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category Name</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Dining Out" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget Limit (₹)</Label>
                  <Input type="number" value={form.budgetAmount} onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })} placeholder="5000" className="text-lg font-medium h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time Period</Label>
                  <Select value={form.period} onValueChange={(v: any) => setForm({ ...form, period: v })}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Icon</Label>
                  <div className="flex gap-2 flex-wrap p-2 bg-muted/30 rounded-xl border">
                    {icons.map(ic => (
                      <button key={ic} onClick={() => setForm({ ...form, icon: ic })} className={`text-2xl h-10 w-10 flex items-center justify-center rounded-lg transition-all ${form.icon === ic ? 'bg-primary border-primary text-white shadow-md shadow-primary/30 scale-110' : 'hover:bg-muted bg-background border border-transparent'}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full h-12 text-md mt-2 rounded-xl font-bold bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all" disabled={isSubmitting}>
                  {isSubmitting ? <span className="animate-pulse">Saving...</span> : (editId ? 'Update Budget' : 'Create Budget')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {budgets.map((b, i) => {
            const pct = Math.round((b.spentAmount / b.budgetAmount) * 100);
            const remaining = b.budgetAmount - b.spentAmount;
            const isOver = remaining < 0;
            const status = pct >= 100 ? "Limit Exceeded" : pct >= 90 ? "Critical" : pct >= 75 ? "Warning" : "Healthy";
            const statusColor = pct >= 100 ? "text-destructive bg-destructive/10 border-destructive/20" : pct >= 90 ? "text-destructive bg-destructive/10 border-destructive/20" : pct >= 75 ? "text-warning bg-warning/10 border-warning/20" : "text-success bg-success/10 border-success/20";
            const barColor = pct >= 90 ? "bg-destructive" : pct >= 75 ? "bg-warning" : "bg-success";
            
            return (
              <motion.div key={b.id} layout initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
                <Card className={`p-6 rounded-2xl border bg-card/80 backdrop-blur-lg hover:shadow-lg transition-all group overflow-hidden relative ${isOver ? 'border-destructive/30 shadow-destructive/5' : 'border-border/50'}`}>
                  {isOver && <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />}
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-muted/50 border flex items-center justify-center text-3xl shadow-sm">
                        {b.icon}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg leading-tight">{b.category}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${statusColor}`}>
                            {status}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
                            {b.period}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => handleEdit(b)} disabled={isLoading}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(b.id)} disabled={isLoading}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 relative z-10">
                    <div className="flex justify-between items-end">
                      <p className="text-3xl font-display font-bold tracking-tight">₹{safeToLocaleString(b.spentAmount)}</p>
                      <p className="text-sm font-medium text-muted-foreground mb-1">of ₹{safeToLocaleString(b.budgetAmount)}</p>
                    </div>
                    
                    <div className="h-3 rounded-full bg-secondary overflow-hidden border border-border/40 relative">
                      <motion.div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all ${barColor}`} 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(pct, 100)}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut" }} 
                      />
                    </div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm font-semibold text-muted-foreground">{pct}% Used</span>
                      <span className={`text-sm font-bold ${isOver ? "text-destructive" : "text-success"}`}>
                        {isOver ? `₹${safeToLocaleString(Math.abs(remaining))} Over` : `₹${safeToLocaleString(remaining)} Left`}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!isLoading && budgets.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-card/40 border border-dashed border-border rounded-3xl">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-display font-bold mb-2">{error ? `Error: ${error}` : "No Active Budgets"}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Create budgets to track your spending and hit your financial goals faster.</p>
          {!error && (
            <Button onClick={() => setOpen(true)} className="rounded-full h-12 px-6 shadow-md shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Create First Budget
            </Button>
          )}
        </motion.div>
      )}

      {isLoading && budgets.length === 0 && (
        <div className="text-center py-24">
          <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-4 text-primary opacity-50" />
          <p className="font-medium text-muted-foreground animate-pulse">Loading budgets...</p>
        </div>
      )}
    </div>
  );
}
