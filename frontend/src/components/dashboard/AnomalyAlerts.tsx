import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, ShieldCheck, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Backend returns ai_flagged_transactions in TWO possible shapes:
 *
 * Shape A — wrapped (expected by original component, never actually sent):
 *   { transaction: { id, description, amount, date, category, ... }, reason: string, severity: string }
 *
 * Shape B — flat (what the backend ACTUALLY sends):
 *   { id, description, amount, date, category, ai_risk_level, ai_explanation, ... }
 *
 * This component handles BOTH shapes safely.
 */
type RawAlert = Record<string, any>;

interface NormalisedAlert {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  reason: string;
  severity: "low" | "medium" | "high";
  ai_explanation?: string;
}

interface AnomalyAlertsProps {
  flaggedTransactions: RawAlert[];
}

// ─── Normalisation ────────────────────────────────────────────────────────────

type SeverityLevel = "low" | "medium" | "high";

/**
 * Normalise any string to a valid SeverityLevel.
 * Handles uppercase ("HIGH"), mixed-case, and unknown values.
 */
function normaliseSeverity(raw: unknown): SeverityLevel {
  if (raw == null) return "high"; // flagged = high by default
  const lower = String(raw).toLowerCase().trim();
  if (lower === "low") return "low";
  if (lower === "medium") return "medium";
  return "high"; // "high", "HIGH", unknown → high
}

/**
 * Safely format a number as INR currency.
 * Returns "₹0" for null / undefined / NaN.
 */
function formatCurrency(raw: unknown): string {
  const n = Number(raw);
  if (isNaN(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Safely format a date string.
 * Returns "—" for null / undefined / invalid dates.
 */
function formatDate(raw: unknown): string {
  if (!raw) return "—";
  try {
    const d = new Date(String(raw));
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Safely capitalise the first letter of a string.
 */
function cap(raw: unknown): string {
  if (!raw) return "—";
  const s = String(raw).trim();
  if (s.length === 0) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Core normaliser — accepts EITHER backend shape and returns a consistent object.
 *
 * Shape A (wrapped):  { transaction: {...}, reason: "...", severity: "..." }
 * Shape B (flat):     { id, description, amount, date, category, ai_risk_level, ... }
 */
function normaliseAlert(raw: RawAlert, index: number): NormalisedAlert {
  // ── Detect Shape A: object has a `transaction` sub-object ──────────────────
  const isWrapped =
    raw.transaction != null &&
    typeof raw.transaction === "object" &&
    !Array.isArray(raw.transaction);

  const tx: RawAlert = isWrapped ? raw.transaction : raw;

  // ── Extract transaction fields (with full null guards) ─────────────────────
  const id =
    tx.id != null && String(tx.id).trim().length > 0
      ? String(tx.id)
      : `alert-${index}`;

  const description =
    tx.description != null && String(tx.description).trim().length > 0
      ? String(tx.description).trim()
      : "Unknown Transaction";

  const amount = Number(tx.amount) || 0;

  const date =
    tx.date != null && String(tx.date).trim().length > 0
      ? String(tx.date).trim()
      : "";

  const category =
    tx.category != null && String(tx.category).trim().length > 0
      ? String(tx.category).trim()
      : "Uncategorised";

  // ── Extract reason ─────────────────────────────────────────────────────────
  // Shape A has raw.reason; Shape B has tx.ai_explanation; fall back to generic
  const reason: string =
    (isWrapped && raw.reason != null && String(raw.reason).trim().length > 0
      ? String(raw.reason).trim()
      : null) ??
    (tx.ai_explanation != null && String(tx.ai_explanation).trim().length > 0
      ? String(tx.ai_explanation).trim()
      : null) ??
    "Flagged as potentially unusual by AI risk model.";

  // ── Extract severity ───────────────────────────────────────────────────────
  // Shape A has raw.severity; Shape B has tx.ai_risk_level
  const rawSeverity = isWrapped
    ? (raw.severity ?? tx.ai_risk_level)
    : (tx.ai_risk_level ?? tx.severity);

  const severity = normaliseSeverity(rawSeverity);

  return {
    id,
    description,
    amount,
    date,
    category,
    reason,
    severity,
    ai_explanation: tx.ai_explanation ?? undefined,
  };
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function getSeverityStyles(severity: SeverityLevel): {
  card: string;
  icon: string;
  badge: string;
  dot: string;
} {
  switch (severity) {
    case "high":
      return {
        card: "border-red-300 bg-red-50",
        icon: "text-red-500",
        badge: "bg-red-100 text-red-700 border-red-200",
        dot: "bg-red-500",
      };
    case "medium":
      return {
        card: "border-yellow-300 bg-yellow-50",
        icon: "text-yellow-600",
        badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
        dot: "bg-yellow-500",
      };
    case "low":
    default:
      return {
        card: "border-blue-200 bg-blue-50",
        icon: "text-blue-500",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-400",
      };
  }
}

function getSeverityIcon(severity: SeverityLevel) {
  switch (severity) {
    case "high":
      return ShieldAlert;
    case "medium":
      return AlertTriangle;
    case "low":
    default:
      return Info;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnomalyAlerts({ flaggedTransactions }: AnomalyAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Guard: ensure we always have an array
  const raw: RawAlert[] = Array.isArray(flaggedTransactions)
    ? flaggedTransactions
    : [];

  // Normalise every entry — this NEVER throws regardless of backend shape
  const normalised: NormalisedAlert[] = raw
    .map((item, i) => {
      try {
        return normaliseAlert(item, i);
      } catch {
        // Absolute last-resort safety net — skip unparseable items silently
        return null;
      }
    })
    .filter((item): item is NormalisedAlert => item !== null);

  // Filter out dismissed alerts
  const active = normalised.filter((a) => !dismissed.has(a.id));

  // Nothing to show
  if (active.length === 0) return null;

  const highCount = active.filter((a) => a.severity === "high").length;

  return (
    <Card className="p-6 border-yellow-200 bg-yellow-50/30">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">
              Anomaly Alerts
            </h3>
            <p className="text-xs text-muted-foreground">
              {active.length} transaction{active.length !== 1 ? "s" : ""}{" "}
              flagged by AI
              {highCount > 0 && (
                <span className="text-red-600 font-medium ml-1">
                  · {highCount} high risk
                </span>
              )}
            </p>
          </div>
        </div>

        {/* High-risk count pill */}
        {highCount > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
            {highCount} HIGH
          </span>
        )}
      </div>

      {/* ── Alert list ── */}
      <AnimatePresence initial={false}>
        <div className="space-y-3">
          {active.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            const Icon = getSeverityIcon(alert.severity);

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl border p-4 ${styles.card}`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Severity icon */}
                    <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold truncate">
                          {alert.description}
                        </span>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide ${styles.badge}`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      {/* Reason */}
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {alert.reason}
                      </p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {formatCurrency(alert.amount)}
                        </span>
                        {alert.date && <span>{formatDate(alert.date)}</span>}
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                          />
                          {cap(alert.category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dismiss button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0 rounded-full hover:bg-black/10"
                    onClick={() =>
                      setDismissed((prev) => new Set([...prev, alert.id]))
                    }
                    aria-label="Dismiss alert"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {/* ── Footer note ── */}
      <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-white/60 border border-yellow-100">
        <ShieldCheck className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          These transactions were flagged by our AI risk model as potentially
          unusual. Please review them to confirm they are legitimate. You can
          dismiss alerts you have already reviewed.
        </p>
      </div>
    </Card>
  );
}
