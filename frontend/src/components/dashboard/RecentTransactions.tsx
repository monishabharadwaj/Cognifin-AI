import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/finance";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { RiskBadge } from "@/components/ui/RiskBadge";

interface Props {
  transactions: Transaction[];
}

const categoryColors: Record<string, string> = {
  Food: "bg-primary/10 text-primary",
  Salary: "bg-success/10 text-success",
  Entertainment: "bg-warning/10 text-warning",
  Transport: "bg-destructive/10 text-destructive",
  Dining: "bg-primary/10 text-primary",
  Freelance: "bg-success/10 text-success",
  Utilities: "bg-warning/10 text-warning",
  Shopping: "bg-destructive/10 text-destructive",
  Health: "bg-success/10 text-success",
  Investment: "bg-primary/10 text-primary",
};

export function RecentTransactions({ transactions }: Props) {
  return (
    <Card className="glass-card">
      <div className="flex items-center justify-between p-5 pb-3">
        <h3 className="text-sm font-semibold">Recent Transactions</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/transactions" className="text-primary text-xs">
            View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-3">
          {transactions.map((t) => (
            <div key={t.id} className={`flex items-center justify-between py-2 border-b last:border-0 ${t.ai_risk_level === 'high' ? 'bg-destructive/5 -mx-2 px-2 rounded-lg' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  {format(parseISO(t.date), "dd MMM")}
                </span>
                <span className="text-sm truncate">{t.description}</span>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge level={t.ai_risk_level} score={t.anomaly_score} explanation={t.ai_explanation} compact />
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[t.category] || "bg-muted text-muted-foreground"}`}>
                  {t.category}
                </span>
                <span className={`text-sm font-semibold tabular-nums ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                  {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
