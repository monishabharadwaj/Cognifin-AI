import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, Target, Brain } from "lucide-react";

interface PredictedSpendingProps {
  prediction: {
    amount: number;
    /**
     * Backend sends a decimal between 0 and 1 (e.g. 0.75 = 75 % confidence).
     * We normalise it to 0-100 internally so the progress bar and label work
     * correctly regardless of whether an upstream change flips the scale.
     */
    confidence: number;
    /**
     * May be a human-readable label like "next month" rather than an ISO date
     * string, so we must guard against invalid Date construction.
     */
    date: string;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

/**
 * Normalise confidence to a 0-100 integer.
 * Handles both decimal (0–1) and already-percentage (1–100) inputs.
 */
function normaliseConfidence(raw: number): number {
  if (raw == null || isNaN(raw)) return 0;
  // If the value is <= 1 it was sent as a decimal fraction
  const pct = raw <= 1 ? raw * 100 : raw;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

/**
 * Try to format the date string nicely.
 * Falls back to the raw string if it cannot be parsed as a Date.
 */
function formatPredictionDate(raw: string): string {
  if (!raw) return "Next Month";

  // Common non-parseable labels returned by the backend
  const lowerRaw = raw.toLowerCase().trim();
  if (lowerRaw === "next month") return "Next Month";
  if (lowerRaw === "next week") return "Next Week";

  // Try ISO / parseable date
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
    }
  } catch {
    // ignore
  }

  // Return the raw string capitalised as a safe fallback
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getConfidenceColor(pct: number): string {
  if (pct >= 80) return "text-success";
  if (pct >= 60) return "text-warning";
  return "text-destructive";
}

function getConfidenceBarColor(pct: number): string {
  if (pct >= 80) return "bg-success";
  if (pct >= 60) return "bg-warning";
  return "bg-destructive";
}

function getConfidenceLabel(pct: number): string {
  if (pct >= 80) return "High";
  if (pct >= 60) return "Medium";
  return "Low";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PredictedSpending({ prediction }: PredictedSpendingProps) {
  if (!prediction || prediction.amount == null) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Predicted Spending</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Brain className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
          <p className="text-sm font-medium text-muted-foreground">
            No prediction available yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Our ML model needs more transaction history to generate an accurate
            spending prediction for next month.
          </p>
        </div>
      </Card>
    );
  }

  const confidencePct = normaliseConfidence(prediction.confidence);
  const confidenceColor = getConfidenceColor(confidencePct);
  const confidenceBarColor = getConfidenceBarColor(confidencePct);
  const confidenceLabel = getConfidenceLabel(confidencePct);
  const dateLabel = formatPredictionDate(prediction.date);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Predicted Spending</h3>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-5"
      >
        {/* Main amount card */}
        <div className="text-center p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Next Predicted Expense
          </p>
          <p className="text-4xl font-bold text-primary">
            {formatCurrency(prediction.amount)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Estimated for {dateLabel}
          </p>
        </div>

        {/* Meta rows */}
        <div className="space-y-4">
          {/* Expected date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Expected period
              </span>
            </div>
            <span className="text-sm font-medium">{dateLabel}</span>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Confidence</span>
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end">
              {/* Progress bar */}
              <div className="w-24 h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${confidenceBarColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              {/* Numeric label */}
              <span
                className={`text-sm font-semibold tabular-nums ${confidenceColor}`}
              >
                {confidencePct}%
              </span>
              {/* Qualitative badge */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                  confidencePct >= 80
                    ? "bg-success/10 text-success border-success/30"
                    : confidencePct >= 60
                      ? "bg-warning/10 text-warning border-warning/30"
                      : "bg-destructive/10 text-destructive border-destructive/30"
                }`}
              >
                {confidenceLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            🤖 This prediction is generated by our LSTM ML model based on your
            historical spending patterns. Actual amounts may vary based on your
            financial decisions.
          </p>
        </div>
      </motion.div>
    </Card>
  );
}
