import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level?: 'low' | 'medium' | 'high';
  score?: number;
  explanation?: string;
  compact?: boolean;
}

const config = {
  low: { emoji: '🟢', label: 'Low Risk', className: 'bg-success/10 text-success' },
  medium: { emoji: '🟡', label: 'Medium Risk', className: 'bg-warning/10 text-warning' },
  high: { emoji: '🔴', label: 'High Risk', className: 'bg-destructive/10 text-destructive' },
};

export function RiskBadge({ level = 'low', score, explanation, compact }: RiskBadgeProps) {
  const c = config[level];

  const badge = (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full cursor-default", c.className)}>
      {c.emoji} {!compact && c.label}
      {score !== undefined && !compact && <span className="opacity-70">({score})</span>}
    </span>
  );

  if (!explanation) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <p>{explanation}</p>
        {score !== undefined && <p className="mt-1 opacity-70">Anomaly Score: {score}/100</p>}
      </TooltipContent>
    </Tooltip>
  );
}
