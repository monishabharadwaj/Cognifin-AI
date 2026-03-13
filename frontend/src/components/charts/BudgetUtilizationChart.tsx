import type { Budget } from "@/types/finance";
import { Progress } from "@/components/ui/progress";

interface Props {
  budgets: Budget[];
}

export function BudgetUtilizationChart({ budgets }: Props) {
  return (
    <div className="space-y-4">
      {budgets.map((b) => {
        const pct = Math.round((b.spentAmount / b.budgetAmount) * 100);
        const color = pct > 90 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-success";
        return (
          <div key={b.id} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>
                {b.icon} {b.category}
              </span>
              <span className="text-muted-foreground">
                ₹{b.spentAmount.toLocaleString("en-IN")} / ₹{b.budgetAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${color}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
