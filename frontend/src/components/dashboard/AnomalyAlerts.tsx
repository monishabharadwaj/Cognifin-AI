import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, ShieldCheck, X, Info, Zap } from "lucide-react";
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-[32px] glass-card-charcoal border-white/[0.05] relative overflow-hidden group mb-8"
    >
      {/* Background ambient glow focus */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center relative shadow-2xl"
               style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="absolute inset-0 pulse-glow-emerald opacity-40 rounded-2xl" />
            <AlertTriangle className="h-7 w-7 text-[#10B981] relative z-10" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight uppercase">
              Anomaly Intelligence
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              AI has flagged <span className="text-white font-bold">{active.length}</span> unusual pattern{active.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* High-risk count badge */}
        {highCount > 0 && (
          <div className="px-4 py-2 rounded-full glass-card-ruby border-red-500/30 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span className="text-xs font-black text-red-500 uppercase tracking-widest">{highCount} High Risk</span>
          </div>
        )}
      </div>

      {/* ── Alert list ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <AnimatePresence mode="popLayout">
          {active.map((alert, index) => {
            const isHigh = alert.severity === "high";

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 260,
                  damping: 20 
                }}
                className={`rounded-2xl border p-5 relative group/item transition-all duration-300 hover:shadow-2xl ${
                  isHigh ? "glass-card-ruby" : "glass-card-charcoal hover:border-emerald-500/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`mt-1 p-2 rounded-lg shrink-0 ${isHigh ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-[#10B981]"}`}>
                      {isHigh ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-bold text-white truncate group-hover/item:text-emerald-400 transition-colors">
                          {alert.description}
                        </span>
                        <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isHigh ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"}`} />
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2 italic">
                        "{alert.reason}"
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.05]">
                        <span className="text-sm font-black text-white px-2.5 py-1 rounded-lg bg-white/[0.05]">
                          {formatCurrency(alert.amount)}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatDate(alert.date)}</span>
                           <div className="h-1 w-1 rounded-full bg-slate-700" />
                           <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest">{alert.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/10 transition-all shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Footer note ── */}
      <div className="mt-8 p-4 rounded-xl bg-black/40 border border-white/[0.05] flex items-center gap-4 relative z-10">
        <div className="h-10 w-10 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5 text-[#10B981] animate-pulse" />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Cognifin AI monitors every transaction in real-time. Flagged items require manual verification to maintain portfolio integrity. <span className="text-[#10B981] cursor-help border-b border-[#10B981]/30">Learn more about our risk model.</span>
        </p>
      </div>
    </motion.div>
  );
}

