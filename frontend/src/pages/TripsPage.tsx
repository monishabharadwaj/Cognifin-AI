import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinanceStore } from "@/stores/financeStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Calendar, Users, MapPin, Trash2, CheckCircle2, Clock, XCircle, Compass, Plus, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, format } from "date-fns";
import type { Trip } from "@/types/finance";
import { safeToLocaleString } from "@/utils/format";

const breakdownIcons: Record<string, string> = {
  Travel: '✈️', Accommodation: '🏨', Food: '🍽️', Transport: '🚗', Activities: '🎯',
};

const statusConfig: Record<Trip['status'], { label: string; color: string; icon: any }> = {
  planning: { label: 'Planning Mode', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  confirmed: { label: 'Confirmed Info', color: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

export default function TripsPage() {
  const { trips, addTrip, updateTripStatus, deleteTrip } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ destination: '', startDate: '', endDate: '', travelers: '2', totalBudget: '', type: 'domestic' as 'domestic' | 'international' });
  const { toast } = useToast();

  const handleCreate = () => {
    if (!form.destination || !form.startDate || !form.endDate || !form.totalBudget) return;
    const budget = Number(form.totalBudget);
    addTrip({
      id: Date.now().toString(),
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      travelers: Number(form.travelers),
      totalBudget: budget,
      savedAmount: 0,
      type: form.type,
      status: 'planning',
      breakdown: [
        { category: 'Travel', amount: Math.round(budget * 0.3), percentage: 30 },
        { category: 'Accommodation', amount: Math.round(budget * 0.35), percentage: 35 },
        { category: 'Food', amount: Math.round(budget * 0.15), percentage: 15 },
        { category: 'Activities', amount: Math.round(budget * 0.12), percentage: 12 },
        { category: 'Transport', amount: Math.round(budget * 0.08), percentage: 8 },
      ],
    });
    toast({ title: "Trip planned! ✈️" });
    setForm({ destination: '', startDate: '', endDate: '', travelers: '2', totalBudget: '', type: 'domestic' });
    setOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border/50 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Trip Planner</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Map out your dream destinations and budget efficiently.</p>
          </div>
        </div>
        <div className="flex gap-2 relative z-10">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-md bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all text-white">
                <Plane className="h-4 w-4 mr-2" /> Plan New Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-2xl">
              <DialogHeader><DialogTitle className="font-display text-xl">Plan Your Next Trip</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destination</Label>
                  <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Bali, Indonesia" className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                    <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
                    <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="h-10 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Travelers</Label>
                    <Input type="number" value={form.travelers} onChange={(e) => setForm({ ...form, travelers: e.target.value })} min="1" className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                    <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="domestic">Domestic</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated Budget (₹)</Label>
                  <Input type="number" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: e.target.value })} placeholder="150000" className="text-lg font-medium h-12 rounded-xl" />
                </div>
                <Button onClick={handleCreate} className="w-full h-12 text-md mt-2 rounded-xl font-bold bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-xl transition-all">
                  Initialize Plan 🌍
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {trips.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-card/40 border border-dashed border-border rounded-3xl">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">No Upcoming Trips</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">The world is waiting! Start planning your next adventure to track expenses.</p>
              <Button onClick={() => setOpen(true)} className="rounded-full h-12 px-6 shadow-md shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />
                Plan Adventure
              </Button>
            </motion.div>
          ) : (
            trips.map((trip, i) => {
              const pct = Math.round((trip.savedAmount / trip.totalBudget) * 100);
              const daysLeft = Math.max(0, differenceInDays(new Date(trip.startDate), new Date()));
              const duration = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) || 1;
              const sc = statusConfig[trip.status];
              const StatusIcon = sc.icon;
              
              return (
                <motion.div key={trip.id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(i * 0.1, 0.4) }}>
                  <Card className="p-0 rounded-2xl border bg-card/80 backdrop-blur-lg hover:shadow-lg transition-all overflow-hidden group">
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border/40">
                      {/* Left Side: Summary & Progress */}
                      <div className="flex-1 p-6 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary uppercase">{format(new Date(trip.startDate), 'MMM')}</span>
                              <span className="text-xl font-display font-bold text-primary">{format(new Date(trip.startDate), 'dd')}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-display font-bold">{trip.destination}</h2>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-muted-foreground/20 text-muted-foreground bg-muted">
                                  {trip.type}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm font-medium text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(trip.startDate), 'MMM do')} → {format(new Date(trip.endDate), 'MMM do, yyyy')}</span>
                                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {trip.travelers} Guests</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {duration} Days</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide inline-flex items-center gap-1.5 border ${sc.color}`}>
                              <StatusIcon className="h-3.5 w-3.5" /> {sc.label}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => { deleteTrip(trip.id); toast({ title: "Trip deleted! 🗑️" }); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-xl border border-muted/50">
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Savings Progress</p>
                              <p className="font-bold text-lg leading-tight mt-0.5">₹{safeToLocaleString(trip.savedAmount)} <span className="text-sm text-muted-foreground font-medium">/ ₹{safeToLocaleString(trip.totalBudget)}</span></p>
                            </div>
                            <span className="text-2xl font-display font-bold text-primary">{pct}%</span>
                          </div>
                          <div className="h-3 rounded-full bg-secondary overflow-hidden border border-border/40 relative">
                            <motion.div className="absolute top-0 left-0 h-full rounded-full gradient-success" initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                          </div>
                          <div className="mt-2 text-xs font-medium flex items-center justify-between">
                            <span className="text-muted-foreground">
                              {trip.status !== 'completed' && trip.status !== 'cancelled' ? (
                                daysLeft > 0 ? <><span className="text-foreground font-bold">{daysLeft}</span> days remaining</> : <span className="text-success font-bold">Trip Started!</span>
                              ) : 'Archived'}
                            </span>
                            {pct < 100 && <span className="text-muted-foreground">₹{safeToLocaleString(trip.totalBudget - trip.savedAmount)} needed</span>}
                          </div>
                        </div>

                        {trip.status === 'planning' && (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-success text-white hover:bg-success/90 rounded-lg shadow-sm" onClick={() => { updateTripStatus(trip.id, 'confirmed'); toast({ title: "Trip confirmed! ✅" }); }}>Confirm Trip</Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => { updateTripStatus(trip.id, 'cancelled'); toast({ title: "Trip cancelled" }); }}>Cancel Plan</Button>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Budget Breakdown */}
                      <div className="p-6 lg:w-80 bg-muted/10">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                          <Target className="w-4 h-4" /> Estimated Budget
                        </h4>
                        <div className="space-y-4">
                          {trip.breakdown.map((b) => (
                            <div key={b.category} className="space-y-1.5 group/item">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium flex items-center gap-2">
                                  <span className="text-base">{breakdownIcons[b.category] || '📦'}</span> {b.category}
                                </span>
                                <span className="font-bold">₹{safeToLocaleString(b.amount)}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-secondary overflow-hidden flex">
                                <div className="h-full rounded-full bg-primary/70 group-hover/item:bg-primary transition-colors" style={{ width: `${Math.max(b.percentage, 2)}%` }} />
                              </div>
                              <p className="text-[10px] text-muted-foreground text-right">{b.percentage}% of total</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
