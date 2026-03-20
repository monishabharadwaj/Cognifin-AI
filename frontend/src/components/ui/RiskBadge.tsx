import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level?: string | null | undefined;
  score?: number | null | undefined;
  explanation?: string | null | undefined;
  compact?: boolean;
}

type RiskLevel = "low" | "medium" | "high";

interface RiskConfig {
  emoji: string;
  label: string;
  className: string;
}

const config: Record<RiskLevel, RiskConfig> = {
  low: {
    emoji: "🟢",
    label: "Low Risk",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  medium: {
    emoji: "🟡",
    label: "Medium Risk",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  high: {
    emoji: "🔴",
    label: "High Risk",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const VALID_LEVELS: RiskLevel[] = ["low", "medium", "high"];

/**
 * Normalises any incoming level value to a valid RiskLevel.
 *
 * Handles:
 *   - undefined / null           → "low"
 *   - "HIGH" / "MEDIUM" / "LOW"  → lowercase equivalent
 *   - any other unknown string   → "low"
 */
function normaliseLevel(raw: string | null | undefined): RiskLevel {
  if (raw == null) return "low";
  const lower = String(raw).toLowerCase().trim() as RiskLevel;
  return VALID_LEVELS.includes(lower) ? lower : "low";
}

export function RiskBadge({
  level,
  score,
  explanation,
  compact = false,
}: RiskBadgeProps) {
  // Always resolve to a safe, defined config — never undefined
  const safeLevel = normaliseLevel(level);
  const c = config[safeLevel];

  // If there is no meaningful risk level at all (original was null/undefined),
  // and we're in compact mode, render nothing to keep the UI clean.
  if (level == null && compact) return null;

  const safeScore =
    score != null && !isNaN(Number(score)) ? Number(score) : undefined;
  const safeExplanation =
    explanation != null && String(explanation).trim().length > 0
      ? String(explanation).trim()
      : undefined;

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border cursor-default select-none",
        c.className,
      )}
    >
      <span aria-hidden="true">{c.emoji}</span>

      {!compact && <span>{c.label}</span>}

      {safeScore !== undefined && !compact && (
        <span className="opacity-60">({safeScore})</span>
      )}
    </span>
  );

  // Only wrap in Tooltip when there is meaningful content to show
  if (!safeExplanation) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        <p>{safeExplanation}</p>
        {safeScore !== undefined && (
          <p className="mt-1 opacity-70">Anomaly Score: {safeScore}/100</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
