import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import type { MLFinancialInsight } from "@/types/finance";

interface AIInsightsProps {
  insights: MLFinancialInsight[];
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const getInsightIcon = (type: MLFinancialInsight['type']) => {
  switch (type) {
    case 'spending_pattern':
      return TrendingUp;
    case 'budget_alert':
      return AlertTriangle;
    case 'savings_opportunity':
      return Lightbulb;
    case 'risk_warning':
      return AlertTriangle;
    default:
      return Brain;
  }
};

const getInsightColor = (impact: MLFinancialInsight['impact']) => {
  switch (impact) {
    case 'high':
      return 'text-destructive bg-destructive/10 border-destructive/20';
    case 'medium':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'low':
      return 'text-success bg-success/10 border-success/20';
    default:
      return 'text-muted-foreground bg-muted/50 border-border';
  }
};

export function AIInsights({ insights }: AIInsightsProps) {
  if (!insights || insights.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">
          No insights available at the moment. Check back later for AI-powered recommendations.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {insights.length} insights
        </span>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.type);
          return (
            <motion.div key={index} variants={item}>
              <div className={`p-4 rounded-lg border ${getInsightColor(insight.impact)}`}>
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-xs opacity-80 mb-2">{insight.description}</p>
                    {insight.actionable && insight.suggested_action && (
                      <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                        <span className="font-medium">Suggested action:</span> {insight.suggested_action}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      insight.impact === 'high' ? 'bg-destructive/20 text-destructive' :
                      insight.impact === 'medium' ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'
                    }`}>
                      {insight.impact}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
}
