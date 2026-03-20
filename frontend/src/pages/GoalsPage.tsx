import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinanceStore } from "@/stores/financeStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Plus, Trophy, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { safeToLocaleString } from "@/utils/format";

const goalIcons: Record<string, string> = {
  emergency: '🛡️', vacation: '✈️', education: '📚', purchase: '💻', investment: '📈', general: '🎯',
};

export default function GoalsPage() {
  const { goals, addGoal, addGoalFunds, completeGoal } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [form, setForm] = useState({ title: '', targetAmount: '', currentAmount: '0', deadline: '', category: 'general' });
  const { toast } = useToast();

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completedCount = goals.filter(g => g.is_completed || g.currentAmount >= g.targetAmount).length;

  const handleCreate = () => {
    if (!form.title || !form.targetAmount || !form.deadline) return;
    addGoal({
      id: Date.now().toString(),
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
  };

  const handleAddFunds = (goalId: string) => {
    if (!fundAmount || Number(fundAmount) <= 0) return;
    addGoalFunds(goalId, Number(fundAmount));
    toast({ title: "Funds added! 💰" });
    setFundAmount("");
    setFundOpen(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Financial Goals</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {completedCount}/{goals.length} completed · ₹{safeToLocaleString(totalCurrent)} / ₹{safeToLocaleString(totalTarget)} saved
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Create Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Goal Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Emergency Fund" /></div>
              <div><Label>Target Amount (₹)</Label><Input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="100000" /></div>
              <div><Label>Current Amount (₹)</Label><Input type="number" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="0" /></div>
              <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">🛡️ Emergency</SelectItem>
                    <SelectItem value="vacation">✈️ Vacation</SelectItem>
                    <SelectItem value="education">📚 Education</SelectItem>
                    <SelectItem value="purchase">💻 Purchase</SelectItem>
                    <SelectItem value="investment">📈 Investment</SelectItem>
                    <SelectItem value="general">🎯 General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Goals", value: goals.length, icon: "🎯" },
          { label: "Completed", value: completedCount, icon: "✅" },
          { label: "In Progress", value: goals.length - completedCount, icon: "🔄" },
          { label: "Overall Progress", value: `${totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0}%`, icon: "📊" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card p-4 text-center">
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-xl font-display font-bold mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g, i) => {
          const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
          const complete = g.is_completed || pct >= 100;
          const daysLeft = Math.max(0, differenceInDays(new Date(g.deadline), new Date()));
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className={`glass-card p-5 hover:shadow-md transition-shadow ${complete ? "ring-2 ring-success/30" : ""}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{g.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{g.title}</h3>
                    {complete ? (
                      <span className="text-xs text-success font-medium flex items-center gap-1"><Trophy className="h-3 w-3" /> Completed! 🎉</span>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {daysLeft} days left</span>
                    )}
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-display font-bold">{pct}%</span>
                  <span className="text-xs text-muted-foreground">₹{safeToLocaleString(g.currentAmount)} / ₹{safeToLocaleString(g.targetAmount)}</span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${complete ? 'gradient-success' : 'gradient-primary'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {!complete && (
                  <div className="flex gap-2 mt-4">
                    <Dialog open={fundOpen === g.id} onOpenChange={(v) => { setFundOpen(v ? g.id : null); setFundAmount(""); }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1 text-xs">Add Funds</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle className="font-display">Add Funds to {g.title}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div><Label>Amount (₹)</Label><Input type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="5000" /></div>
                          <Button onClick={() => handleAddFunds(g.id)} className="w-full gradient-primary text-primary-foreground">Add Funds</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { completeGoal(g.id); toast({ title: "Goal completed! 🎉🏆" }); }}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
