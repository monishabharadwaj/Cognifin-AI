import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/finance";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { safeToLocaleString } from "@/utils/format";

interface Props {
  transactions: Transaction[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely format a date string to "dd MMM" (e.g. "15 Jul").
 * Returns "—" if the value is null, undefined, or unparseable.
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

/**
 * Safely capitalise the first letter of a string.
 * Returns "—" for null / undefined / empty.
 */
function safeCategory(raw: string | null | undefined): string {
  if (!raw || raw.trim().length === 0) return "—";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/**
 * Returns a stable React key for a transaction, falling back to index.
 */
function txKey(t: Transaction, index: number): string {
  return t.id != null && String(t.id).trim().length > 0
    ? String(t.id)
    : `tx-${index}`;
}

// ─── Category colour map ──────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-100 text-orange-700",
  salary: "bg-green-100  text-green-700",
  entertainment: "bg-purple-100 text-purple-700",
  transport: "bg-blue-100   text-blue-700",
  dining: "bg-orange-100 text-orange-700",
  freelance: "bg-teal-100   text-teal-700",
  utilities: "bg-yellow-100 text-yellow-700",
  shopping: "bg-pink-100   text-pink-700",
  health: "bg-green-100  text-green-700",
  investment: "bg-indigo-100 text-indigo-700",
  rent: "bg-red-100    text-red-700",
  education: "bg-cyan-100   text-cyan-700",
  travel: "bg-sky-100    text-sky-700",
};

function getCategoryColor(raw: string | null | undefined): string {
  if (!raw) return "bg-muted text-muted-foreground";
  const key = raw.toLowerCase().trim();
  return CATEGORY_COLORS[key] ?? "bg-muted text-muted-foreground";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecentTransactions({ transactions }: Props) {
  // Guard: ensure we always render an array
  const safe: Transaction[] = Array.isArray(transactions) ? transactions : [];

  return (
    <Card className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">Recent Transactions</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link
            to="/transactions"
            className="text-primary text-xs flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Body */}
      <div className="px-5 pb-4">
        {safe.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No recent transactions found.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {safe.map((t, index) => {
              const isHighRisk =
                t.ai_risk_level != null &&
                String(t.ai_risk_level).toLowerCase() === "high";

              return (
                <div
                  key={txKey(t, index)}
                  className={[
                    "flex items-center justify-between py-3 gap-2 transition-colors",
                    isHighRisk
                      ? "bg-destructive/5 -mx-5 px-5 border-l-2 border-l-destructive"
                      : "hover:bg-muted/30 -mx-5 px-5",
                  ].join(" ")}
                >
                  {/* Left — date + description */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground w-14 shrink-0 tabular-nums">
                      {safeDateFormat(t.date)}
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm truncate leading-tight">
                        {t.description ?? "—"}
                      </p>
                      {/* Show category on small screens below description */}
                      <span
                        className={[
                          "inline-block sm:hidden text-xs px-1.5 py-0.5 rounded-full mt-0.5",
                          getCategoryColor(t.category),
                        ].join(" ")}
                      >
                        {safeCategory(t.category)}
                      </span>
                    </div>
                  </div>

                  {/* Right — risk badge + category + amount */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Risk badge — only rendered when level is present */}
                    <RiskBadge
                      level={t.ai_risk_level}
                      score={t.anomaly_score}
                      explanation={t.ai_explanation}
                      compact
                    />

                    {/* Category chip — hidden on very small screens */}
                    <span
                      className={[
                        "hidden sm:inline-block text-xs px-2 py-0.5 rounded-full",
                        getCategoryColor(t.category),
                      ].join(" ")}
                    >
                      {safeCategory(t.category)}
                    </span>

                    {/* Amount */}
                    <div className="flex items-center gap-1">
                      {t.type === "income" ? (
                        <TrendingUp className="h-3 w-3 text-green-600 shrink-0" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />
                      )}
                      <span
                        className={[
                          "text-sm font-semibold tabular-nums",
                          t.type === "income"
                            ? "text-green-600"
                            : "text-red-500",
                        ].join(" ")}
                      >
                        {t.type === "income" ? "+" : "−"}₹
                        {safeToLocaleString(
                          typeof t.amount === "number"
                            ? t.amount
                            : parseFloat(String(t.amount)) || 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
