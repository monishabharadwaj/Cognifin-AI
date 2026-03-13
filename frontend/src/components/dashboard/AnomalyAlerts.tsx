import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AnomalyAlertsProps {
  flaggedTransactions: Array<{
    transaction: any;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

function getSeverityColor(severity: 'low' | 'medium' | 'high') {
  switch (severity) {
    case 'high':
      return 'border-destructive bg-destructive/5';
    case 'medium':
      return 'border-warning bg-warning/5';
    case 'low':
      return 'border-info bg-info/5';
    default:
      return 'border-border bg-muted/20';
  }
}

function getSeverityIcon(severity: 'low' | 'medium' | 'high') {
  return AlertTriangle;
}

export function AnomalyAlerts({ flaggedTransactions }: AnomalyAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  const activeAlerts = flaggedTransactions.filter((_, index) => !dismissedAlerts.has(index));

  const dismissAlert = (index: number) => {
    setDismissedAlerts(prev => new Set([...prev, index]));
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-semibold">Anomaly Alerts</h3>
        <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
          {activeAlerts.length} alerts
        </span>
      </div>

      <div className="space-y-3">
        {activeAlerts.map((alert, originalIndex) => {
          const Icon = getSeverityIcon(alert.severity);
          const isHighSeverity = alert.severity === 'high';
          
          return (
            <motion.div
              key={originalIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    isHighSeverity ? 'text-destructive' :
                    alert.severity === 'medium' ? 'text-warning' :
                    'text-info'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{alert.transaction.description}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isHighSeverity ? 'bg-destructive/20 text-destructive' :
                        alert.severity === 'medium' ? 'bg-warning/20 text-warning' :
                        'bg-info/20 text-info'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{alert.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Amount: {formatCurrency(alert.transaction.amount)}</span>
                      <span>Date: {new Date(alert.transaction.date).toLocaleDateString()}</span>
                      <span>Category: {alert.transaction.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => dismissAlert(originalIndex)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {activeAlerts.length > 0 && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            These transactions were flagged by our AI system as potentially unusual. 
            Please review them to ensure they're legitimate.
          </p>
        </div>
      )}
    </Card>
  );
}
