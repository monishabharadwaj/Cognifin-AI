import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinanceStore } from "@/stores/financeStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Plane, Calendar, Users, MapPin, Trash2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, format } from "date-fns";
import type { Trip } from "@/types/finance";

const breakdownIcons: Record<string, string> = {
  Travel: '✈️', Accommodation: '🏨', Food: '🍽️', Transport: '🚗', Activities: '🎯',
};

const statusConfig: Record<Trip['status'], { label: string; color: string; icon: any }> = {
  planning: { label: 'Planning', color: 'bg-warning/10 text-warning', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Trip Planner</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plane className="h-4 w-4 mr-2" /> Plan New Trip</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Plan Your Trip</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Goa" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Travelers</Label><Input type="number" value={form.travelers} onChange={(e) => setForm({ ...form, travelers: e.target.value })} min="1" /></div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="domestic">Domestic</SelectItem><SelectItem value="international">International</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Estimated Budget (₹)</Label><Input type="number" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: e.target.value })} placeholder="50000" /></div>
              <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">Create Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {trips.length === 0 && (
        <Card className="glass-card p-12 text-center">
          <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No trips planned yet. Start planning your next adventure!</p>
        </Card>
      )}

      {trips.map((trip, i) => {
        const pct = Math.round((trip.savedAmount / trip.totalBudget) * 100);
        const daysLeft = Math.max(0, differenceInDays(new Date(trip.startDate), new Date()));
        const duration = differenceInDays(new Date(trip.endDate), new Date(trip.startDate));
        const sc = statusConfig[trip.status];
        const StatusIcon = sc.icon;
        return (
          <motion.div key={trip.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-bold">{trip.destination}</h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {format(new Date(trip.startDate), 'dd MMM')} → {format(new Date(trip.endDate), 'dd MMM yyyy')}</span>
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {trip.travelers} travelers</span>
                          <span>{duration} days</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${sc.color}`}>
                        <StatusIcon className="h-3 w-3" /> {sc.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Savings Progress</span>
                      <span className="font-semibold">{pct}% — ₹{trip.savedAmount.toLocaleString("en-IN")} / ₹{trip.totalBudget.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary overflow-hidden">
                      <motion.div className="h-full rounded-full gradient-success" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {trip.status !== 'completed' && trip.status !== 'cancelled' ? `${daysLeft} days until trip` : ''}
                    </p>
                  </div>

                  {trip.status === 'planning' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { updateTripStatus(trip.id, 'confirmed'); toast({ title: "Trip confirmed! ✅" }); }}>Confirm</Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => { updateTripStatus(trip.id, 'cancelled'); toast({ title: "Trip cancelled" }); }}>Cancel</Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive ml-auto" onClick={() => { deleteTrip(trip.id); toast({ title: "Trip deleted" }); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="lg:w-72 space-y-3">
                  <h4 className="text-sm font-semibold">Budget Breakdown</h4>
                  {trip.breakdown.map((b) => (
                    <div key={b.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{breakdownIcons[b.category] || '📦'} {b.category}</span>
                        <span className="font-medium">₹{b.amount.toLocaleString("en-IN")} ({b.percentage}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full gradient-primary" style={{ width: `${b.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
