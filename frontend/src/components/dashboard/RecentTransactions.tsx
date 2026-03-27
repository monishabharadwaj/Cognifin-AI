import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/finance";
import { ArrowRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { safeToLocaleString } from "@/utils/format";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  transactions: Transaction[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function safeCategory(raw: string | null | undefined): string {
  if (!raw || raw.trim().length === 0) return "—";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function txKey(t: Transaction, index: number): string {
  return t.id != null && String(t.id).trim().length > 0
    ? String(t.id)
    : `tx-${index}`;
}

// ─── Category colour map ──────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function RecentTransactions({ transactions }: Props) {
  const safe: Transaction[] = Array.isArray(transactions) ? transactions : [];

  return (
    <Card className="rounded-2xl border border-border/50 shadow-sm bg-card/80 backdrop-blur-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-muted/20">
        <div>
          <h3 className="text-lg font-display font-semibold tracking-tight">Recent Transactions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your latest financial activity</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary transition-colors rounded-full px-4">
          <Link to="/transactions" className="text-sm font-medium flex items-center gap-1.5">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Body */}
      <div className="px-6 py-2">
        {safe.length === 0 ? (
          <div className="py-12 text-center">
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No recent transactions</p>
            <p className="text-xs text-muted-foreground mt-1">Your activity will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            <AnimatePresence>
              {safe.slice(0, 5).map((t, index) => {
                const isCredit = t.type === "income" || (t.type as string) === "credit";
                const isHighRisk = !isCredit &&
                  t.ai_risk_level != null &&
                  String(t.ai_risk_level).toLowerCase() === "high";

                return (
                  <motion.div
                    key={txKey(t, index)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={[
                      "flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 transition-colors group",
                      isHighRisk
                        ? "bg-destructive/5 -mx-6 px-6 border-l-2 border-l-destructive"
                        : "hover:bg-muted/30 -mx-6 px-6",
                    ].join(" ")}
                  >
                    {/* Left — Date Icon + description */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={[
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        isCredit ? "bg-success/10 border-success/20 text-success" : "bg-primary/10 border-primary/20 text-primary"
                      ].join(" ")}>
                        {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors">
                          {t.description ?? "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 -ml-1">
                          <span className="text-[11px] font-medium text-muted-foreground px-1 py-0.5">
                            {safeDateFormat(t.date)}
                          </span>
                          <span className="text-muted-foreground/30 text-[10px]">•</span>
                          <span
                            className={[
                              "inline-block text-[10px] font-medium px-2 py-0.5 rounded-md border",
                              getCategoryColor(t.category),
                            ].join(" ")}
                          >
                            {safeCategory(t.category)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right — risk badge + amount */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 ml-14 sm:ml-0">
                      {/* Risk badge */}
                      {!isCredit && (
                        <div className="scale-90 origin-right">
                          <RiskBadge
                            level={t.ai_risk_level}
                            score={t.anomaly_score}
                            explanation={t.ai_explanation}
                            compact
                          />
                        </div>
                      )}

                      {/* Amount */}
                      <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
                        <span
                          className={[
                            "text-[15px] font-bold tabular-nums",
                            isCredit ? "text-success" : "text-foreground",
                          ].join(" ")}
                        >
                          {isCredit ? "+" : "−"}₹
                          {safeToLocaleString(
                            typeof t.amount === "number"
                              ? t.amount
                              : parseFloat(String(t.amount)) || 0,
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
}
