import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Wallet,
  Activity,
  CheckCircle2,
} from "lucide-react";

interface AIInsightsProps {
  /**
   * Backend returns insights as plain strings, e.g.:
   *   "📈 Spending went up 10% this month"
   *   "🎉 Awesome! Spending down 5% from last month"
   */
  insights: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInsightIcon(text: string) {
  const lower = text.toLowerCase();

  if (
    lower.includes("over budget") ||
    lower.includes("went up") ||
    lower.includes("🚨") ||
    lower.includes("oops") ||
    lower.includes("watch out") ||
    lower.includes("almost") ||
    lower.includes("⚠️")
  ) {
    return <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />;
  }

  if (
    lower.includes("income") ||
    lower.includes("salary") ||
    lower.includes("earn") ||
    lower.includes("💰") ||
    lower.includes("grew")
  ) {
    return <TrendingUp className="h-4 w-4 flex-shrink-0 mt-0.5" />;
  }

  if (
    lower.includes("spending down") ||
    lower.includes("less than") ||
    lower.includes("decreased") ||
    lower.includes("🎉") ||
    lower.includes("awesome")
  ) {
    return <TrendingDown className="h-4 w-4 flex-shrink-0 mt-0.5" />;
  }

  if (
    lower.includes("save") ||
    lower.includes("saving") ||
    lower.includes("budget") ||
    lower.includes("💡") ||
    lower.includes("pro tip")
  ) {
    return <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />;
  }

  if (
    lower.includes("predict") ||
    lower.includes("next month") ||
    lower.includes("🔮")
  ) {
    return <Activity className="h-4 w-4 flex-shrink-0 mt-0.5" />;
  }

  if (
    lower.includes("good progress") ||
    lower.includes("✅") ||
    lower.includes("great")
  ) {
    return <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />;
  }

  if (
    lower.includes("wallet") ||
    lower.includes("₹") ||
    lower.includes("spend")
  ) {
    return <Wallet className="h-4 w-4 flex-shrink-0 mt-0.5" />;
  }

  return <Brain className="h-4 w-4 flex-shrink-0 mt-0.5" />;
}

function getInsightStyles(text: string): {
  card: string;
  icon: string;
} {
  const lower = text.toLowerCase();

  // High severity / negative
  if (
    lower.includes("over budget") ||
    lower.includes("🚨") ||
    lower.includes("oops") ||
    lower.includes("quite high") ||
    lower.includes("went up")
  ) {
    return {
      card: "border-destructive/30 bg-destructive/5",
      icon: "text-destructive",
    };
  }

  // Warning / caution
  if (
    lower.includes("watch out") ||
    lower.includes("almost") ||
    lower.includes("⚠️") ||
    lower.includes("📈") ||
    lower.includes("📝")
  ) {
    return {
      card: "border-warning/30 bg-warning/5",
      icon: "text-warning",
    };
  }

  // Positive / good
  if (
    lower.includes("awesome") ||
    lower.includes("🎉") ||
    lower.includes("✅") ||
    lower.includes("good progress") ||
    lower.includes("spending down") ||
    lower.includes("less than") ||
    lower.includes("income grew") ||
    lower.includes("💰")
  ) {
    return {
      card: "border-success/30 bg-success/5",
      icon: "text-success",
    };
  }

  // Prediction / info
  if (
    lower.includes("predict") ||
    lower.includes("🔮") ||
    lower.includes("next month")
  ) {
    return {
      card: "border-violet-500/30 bg-violet-500/5",
      icon: "text-violet-500",
    };
  }

  // Tips / suggestions
  if (
    lower.includes("💡") ||
    lower.includes("pro tip") ||
    lower.includes("save")
  ) {
    return {
      card: "border-primary/30 bg-primary/5",
      icon: "text-primary",
    };
  }

  // Default neutral
  return {
    card: "border-border bg-muted/30",
    icon: "text-muted-foreground",
  };
}

// ─── Animation variants ───────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AIInsights({ insights }: AIInsightsProps) {
  // Normalise: filter out any falsy entries
  const validInsights = Array.isArray(insights)
    ? insights.filter((i) => typeof i === "string" && i.trim().length > 0)
    : [];

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Insights</h3>
        {validInsights.length > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {validInsights.length}{" "}
            {validInsights.length === 1 ? "insight" : "insights"}
          </span>
        )}
      </div>

      {/* Content */}
      {validInsights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Brain className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
          <p className="text-sm font-medium text-muted-foreground">
            No AI insights available yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Add more transactions so our AI can start analysing your spending
            patterns and provide personalised recommendations.
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3 max-h-80 overflow-y-auto pr-1"
        >
          {validInsights.map((insight, index) => {
            const styles = getInsightStyles(insight);
            const icon = getInsightIcon(insight);

            return (
              <motion.div
                key={index}
                variants={itemVariant}
                className={`flex items-start gap-3 p-3 rounded-lg border ${styles.card}`}
              >
                {/* Icon — clone with dynamic colour class */}
                <span className={styles.icon}>{icon}</span>

                {/* Text */}
                <p className="text-sm leading-relaxed flex-1">{insight}</p>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </Card>
  );
}
