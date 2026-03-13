import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useFinanceStore } from "@/stores/financeStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pencil, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const icons = ['🍕', '🚗', '🎬', '🛍️', '💡', '🏥', '📚', '🏠', '💳', '✈️'];

export default function BudgetPage() {
  const { budgets, addBudget, deleteBudget, updateBudget } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: '', budgetAmount: '', period: 'monthly' as 'monthly' | 'weekly' | 'yearly', icon: '🍕' });
  const { toast } = useToast();

  const totalBudget = budgets.reduce((s, b) => s + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
  const overBudgetCount = budgets.filter(b => b.spentAmount > b.budgetAmount).length;

  const handleSave = () => {
    if (!form.category || !form.budgetAmount) return;
    if (editId) {
      updateBudget({ id: editId, category: form.category, budgetAmount: Number(form.budgetAmount), spentAmount: budgets.find(b => b.id === editId)?.spentAmount || 0, period: form.period, icon: form.icon });
      toast({ title: "Budget updated ✅" });
    } else {
      addBudget({ id: Date.now().toString(), category: form.category, budgetAmount: Number(form.budgetAmount), spentAmount: 0, period: form.period, icon: form.icon });
      toast({ title: "Budget created ✅" });
    }
    setForm({ category: '', budgetAmount: '', period: 'monthly', icon: '🍕' });
    setEditId(null);
    setOpen(false);
  };

  const handleEdit = (b: typeof budgets[0]) => {
    setEditId(b.id);
    setForm({ category: b.category, budgetAmount: b.budgetAmount.toString(), period: b.period, icon: b.icon });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteBudget(id);
    toast({ title: "Budget deleted" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Budget Manager</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Total: ₹{totalSpent.toLocaleString("en-IN")} / ₹{totalBudget.toLocaleString("en-IN")}
            {overBudgetCount > 0 && <span className="text-destructive font-medium ml-2">· {overBudgetCount} over budget</span>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ category: '', budgetAmount: '', period: 'monthly', icon: '🍕' }); } }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Create Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">{editId ? 'Edit' : 'Create'} Budget</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Food & Groceries" /></div>
              <div><Label>Budget Amount (₹)</Label><Input type="number" value={form.budgetAmount} onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })} placeholder="10000" /></div>
              <div><Label>Period</Label>
                <Select value={form.period} onValueChange={(v: any) => setForm({ ...form, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                  {icons.map(ic => (
                    <button key={ic} onClick={() => setForm({ ...form, icon: ic })} className={`text-2xl p-1 rounded-lg transition-colors ${form.icon === ic ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted'}`}>{ic}</button>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">{editId ? 'Update' : 'Create'} Budget</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b, i) => {
          const pct = Math.round((b.spentAmount / b.budgetAmount) * 100);
          const remaining = b.budgetAmount - b.spentAmount;
          const isOver = remaining < 0;
          const status = pct > 100 ? "Over Budget" : pct > 90 ? "Critical" : pct > 70 ? "Warning" : "On Track";
          const statusColor = pct > 100 ? "text-destructive bg-destructive/10" : pct > 90 ? "text-destructive bg-destructive/10" : pct > 70 ? "text-warning bg-warning/10" : "text-success bg-success/10";
          const barColor = pct > 90 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-success";
          return (
            <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className={`glass-card p-5 hover:shadow-md transition-shadow ${isOver ? 'ring-1 ring-destructive/30' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{b.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{b.category}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{status}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(b)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-semibold">₹{b.budgetAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-semibold">₹{b.spentAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div className={`h-full rounded-full transition-all ${barColor}`} initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{pct}% used</span>
                    <span className={isOver ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {isOver ? `₹${Math.abs(remaining).toLocaleString("en-IN")} over` : `₹${remaining.toLocaleString("en-IN")} left`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground capitalize">{b.period} budget</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
