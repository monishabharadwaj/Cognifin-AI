import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetPage from "./pages/BudgetPage";
import GoalsPage from "./pages/GoalsPage";
import TripsPage from "./pages/TripsPage";
import AdvisorPage from "./pages/AdvisorPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary
            fallback={({ error, reset }) => (
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">Navigation Error</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error?.message || 'An error occurred while navigating.'}
                  </p>
                  <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                    Go Home
                  </button>
                </div>
              </div>
            )}
          >
            <Routes>
              {/* Auth routes (no sidebar) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* App routes (with dashboard layout) */}
              <Route path="/" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
              <Route path="/transactions" element={<DashboardLayout><TransactionsPage /></DashboardLayout>} />
              <Route path="/budget" element={<DashboardLayout><BudgetPage /></DashboardLayout>} />
              <Route path="/goals" element={<DashboardLayout><GoalsPage /></DashboardLayout>} />
              <Route path="/trips" element={<DashboardLayout><TripsPage /></DashboardLayout>} />
              <Route path="/advisor" element={<DashboardLayout><AdvisorPage /></DashboardLayout>} />
              <Route path="/analytics" element={<DashboardLayout><AnalyticsPage /></DashboardLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
