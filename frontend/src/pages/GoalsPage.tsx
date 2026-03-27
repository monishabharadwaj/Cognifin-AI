import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinanceStore } from "@/stores/financeStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Plus, Trophy, Clock, X, Target, Flag, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { safeToLocaleString } from "@/utils/format";

const goalIcons: Record<string, string> = {
  emergency: '🛡️', vacation: '✈️', education: '📚', purchase: '💻', investment: '📈', general: '🎯',
};

export default function GoalsPage() {
  const { goals, addGoal, addGoalFunds, completeGoal, deleteGoal } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [form, setForm] = useState({ title: '', targetAmount: '', currentAmount: '0', deadline: '', category: 'general' });
  const { toast } = useToast();

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completedCount = goals.filter(g => g.is_completed || g.currentAmount >= g.targetAmount).length;

  const handleCreate = async () => {
    if (!form.title || !form.targetAmount || !form.deadline) return;
    try {
      await addGoal({
        title: form.title,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount) || 0,
        deadline: form.deadline,
        category: form.category,
        icon: goalIcons[form.category] || '🎯',
        is_completed: false,
      });
      toast({ title: "Goal created! 🎯" });
      setForm({ title: '', targetAmount: '', currentAmount: '0', deadline: '', category: 'general' });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to create goal", description: err.message || String(err), variant: "destructive" });
    }
  };

  const handleAddFunds = (goalId: string) => {
    if (!fundAmount || Number(fundAmount) <= 0) return;
    addGoalFunds(goalId, Number(fundAmount));
    toast({ title: "Funds added! 💰" });
    setFundAmount("");
    setFundOpen(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border/50 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Flag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Financial Goals</h1>
            <div className="text-sm font-medium mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Overall Saved:</span>
              <span className="text-foreground border px-2 py-0.5 rounded-md">₹{safeToLocaleString(totalCurrent)} / ₹{safeToLocaleString(totalTarget)}</span>
              {completedCount > 0 && (
                <span className="text-xs bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full flex items-center shadow-sm">
                  <Trophy className="w-3 h-3 mr-1" /> {completedCount} achieved
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 relative z-10">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-md bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all text-white">
                <Plus className="h-4 w-4 mr-2" /> New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader><DialogTitle className="font-display text-xl">Create Goal</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goal Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Dream House Downpayment" className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target (₹)</Label>
                    <Input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="100000" className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current (₹)</Label>
                    <Input type="number" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="0" className="h-10 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Date</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">🛡️ Emergency Fund</SelectItem>
                      <SelectItem value="vacation">✈️ Vacation</SelectItem>
                      <SelectItem value="education">📚 Education</SelectItem>
                      <SelectItem value="purchase">💻 Big Purchase</SelectItem>
                      <SelectItem value="investment">📈 Investment</SelectItem>
                      <SelectItem value="general">🎯 General Goal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full h-12 text-md mt-2 rounded-xl font-bold bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all">
                  Launch Goal <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Board */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Goals", value: goals.length, icon: "🎯", color: "text-primary bg-primary/10 border-primary/20" },
            { label: "Completed", value: completedCount, icon: "✅", color: "text-success bg-success/10 border-success/20" },
            { label: "In Progress", value: goals.length - completedCount, icon: "⏳", color: "text-warning bg-warning/10 border-warning/20" },
            { label: "Progress", value: `${totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0}%`, icon: "📈", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-4 border bg-card/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-center hover:shadow-md transition-all">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl mb-3 border ${stat.color}`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-display font-bold leading-none mb-1">{stat.value}</p>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {goals.map((g, i) => {
            const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
            const complete = g.is_completed || pct >= 100;
            const daysLeft = Math.max(0, differenceInDays(new Date(g.deadline), new Date()));
            
            return (
              <motion.div key={g.id} layout initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
                <Card className={`p-6 rounded-2xl border bg-card/80 backdrop-blur-lg hover:shadow-lg transition-all group overflow-hidden relative ${complete ? 'border-success/40 shadow-success/10' : 'border-border/50'}`}>
                  {complete && <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />}
                  
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-muted/50 border flex items-center justify-center text-3xl shadow-sm shrink-0">
                      {g.icon}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <h3 className="font-display font-bold text-lg leading-tight truncate">{g.title}</h3>
                      <div className="mt-1">
                        {complete ? (
                          <span className="text-xs text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                            <Trophy className="h-3 w-3" /> Goal Achieved!
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {daysLeft} days left
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => { deleteGoal(g.id); toast({ title: "Goal deleted! 🗑️" }) }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-end">
                      <p className={`text-3xl font-display font-bold tracking-tight ${complete ? 'text-success' : 'text-foreground'}`}>
                        {Math.min(pct, 100)}%
                      </p>
                      <p className="text-sm font-medium text-muted-foreground mb-1 text-right">
                        <span className="block text-foreground">₹{safeToLocaleString(g.currentAmount)}</span>
                        of ₹{safeToLocaleString(g.targetAmount)}
                      </p>
                    </div>
                    
                    <div className="h-3 rounded-full bg-secondary overflow-hidden border border-border/40 relative">
                      <motion.div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all ${complete ? 'bg-success' : 'bg-gradient-to-r from-primary to-purple-600'}`} 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(pct, 100)}%` }} 
                        transition={{ duration: 0.8, ease: "easeOut" }} 
                      />
                    </div>
                  </div>

                  {!complete && (
                    <div className="flex gap-2 mt-6 relative z-10">
                      <Dialog open={fundOpen === g.id} onOpenChange={(v) => { setFundOpen(v ? g.id : null); setFundAmount(""); }}>
                        <DialogTrigger asChild>
                          <Button className="flex-1 rounded-xl font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                            Add Funds
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px] rounded-2xl">
                          <DialogHeader><DialogTitle className="font-display">Contribute to {g.title}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (₹)</Label>
                              <Input type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="0.00" className="h-12 text-lg font-medium rounded-xl" />
                            </div>
                            <Button onClick={() => handleAddFunds(g.id)} className="w-full h-12 text-md mt-2 rounded-xl font-bold bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all">
                              Lock Funds 💰
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" className="rounded-xl border-border hover:bg-success hover:text-white hover:border-success transition-all" onClick={() => { completeGoal(g.id); toast({ title: "Goal completed manually! 🎉🏆" }); }}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {goals.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-card/40 border border-dashed border-border rounded-3xl">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-display font-bold mb-2">No Goals Set</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Dream big and start saving! Create your first financial goal to track your progress.</p>
          <Button onClick={() => setOpen(true)} className="rounded-full h-12 px-6 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            Set First Goal
          </Button>
        </motion.div>
      )}
    </div>
  );
}
