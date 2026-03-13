import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, Target } from "lucide-react";

interface PredictedSpendingProps {
  prediction: {
    amount: number;
    confidence: number;
    date: string;
  };
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 80) return 'text-success';
  if (confidence >= 60) return 'text-warning';
  return 'text-destructive';
}

function getConfidenceLabel(confidence: number) {
  if (confidence >= 80) return 'High';
  if (confidence >= 60) return 'Medium';
  return 'Low';
}

export function PredictedSpending({ prediction }: PredictedSpendingProps) {
  const confidenceColor = getConfidenceColor(prediction.confidence);
  const confidenceLabel = getConfidenceLabel(prediction.confidence);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Predicted Spending</h3>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="text-2xl font-bold text-primary mb-1">
            {formatCurrency(prediction.amount)}
          </div>
          <div className="text-sm text-muted-foreground">Next predicted expense</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Expected date</span>
            </div>
            <span className="text-sm font-medium">
              {new Date(prediction.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    prediction.confidence >= 80 ? 'bg-success' :
                    prediction.confidence >= 60 ? 'bg-warning' :
                    'bg-destructive'
                  }`}
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${confidenceColor}`}>
                {prediction.confidence}% ({confidenceLabel})
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            This prediction is based on your spending patterns and transaction history. 
            Actual amounts may vary based on your financial decisions.
          </p>
        </div>
      </motion.div>
    </Card>
  );
}
