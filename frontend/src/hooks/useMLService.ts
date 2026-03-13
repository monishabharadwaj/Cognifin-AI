import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import type { 
  MLPredictionResponse, 
  MLTransactionAnalysis, 
  MLFinancialReport,
  Transaction 
} from '@/types/finance';

// Hook for spending prediction
export function useSpendingPrediction(sequence: number[]) {
  return useQuery<MLPredictionResponse>({
    queryKey: ['spending-prediction', sequence],
    queryFn: () => apiClient.predictSpending(sequence),
    enabled: sequence.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for transaction analysis
export function useTransactionAnalysis(transactionAmount: number, sequence: number[]) {
  return useQuery<MLTransactionAnalysis>({
    queryKey: ['transaction-analysis', transactionAmount, sequence],
    queryFn: () => apiClient.analyzeTransaction(transactionAmount, sequence),
    enabled: transactionAmount > 0 && sequence.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook for financial report
export function useFinancialReport(transactions: Transaction[]) {
  return useQuery<MLFinancialReport>({
    queryKey: ['financial-report', transactions],
    queryFn: () => apiClient.getFinancialReport(transactions),
    enabled: transactions.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for financial chat
export function useFinancialChat() {
  return useMutation({
    mutationFn: ({ question, transactions }: { question: string; transactions: Transaction[] }) =>
      apiClient.financialChat(question, transactions),
  });
}

// Hook for budget analysis
export function useBudgetAnalysis(transactions: Transaction[], budgets: any) {
  return useQuery({
    queryKey: ['budget-analysis', transactions, budgets],
    queryFn: () => apiClient.getBudgetAnalysis(transactions, budgets),
    enabled: transactions.length > 0 && budgets,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Hook for real-time transaction monitoring
export function useTransactionMonitor(transaction: Transaction, allTransactions: Transaction[]) {
  // Create sequence from recent transactions (last 30 days)
  const sequence = allTransactions
    .filter(t => t.type === 'expense')
    .slice(-20)
    .map(t => t.amount);

  return useQuery<MLTransactionAnalysis>({
    queryKey: ['transaction-monitor', transaction.id],
    queryFn: () => apiClient.analyzeTransaction(transaction.amount, sequence),
    enabled: !!transaction && sequence.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
