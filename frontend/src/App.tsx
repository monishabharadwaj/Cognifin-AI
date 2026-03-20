import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetPage from "./pages/BudgetPage";
import GoalsPage from "./pages/GoalsPage";
import TripsPage from "./pages/TripsPage";
import AdvisorPage from "./pages/AdvisorPage";
import AnalyticsPage from "./pages/AnalyticsPage";

import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <ErrorBoundary
            fallback={({ error, reset }) => (
              <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <div className="text-center max-w-sm">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2">
                    Navigation Error
                  </h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    {error?.message || "An error occurred while navigating."}
                  </p>
                  <button
                    onClick={reset}
                    className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            )}
          >
            <Routes>
              {/* ── Public auth routes (no layout) ── */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* ── Root → login ── */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* ── Protected app routes (with sidebar layout) ── */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedPage>
                    <DashboardPage />
                  </ProtectedPage>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedPage>
                    <TransactionsPage />
                  </ProtectedPage>
                }
              />
              <Route
                path="/budget"
                element={
                  <ProtectedPage>
                    <BudgetPage />
                  </ProtectedPage>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedPage>
                    <GoalsPage />
                  </ProtectedPage>
                }
              />
              <Route
                path="/trips"
                element={
                  <ProtectedPage>
                    <TripsPage />
                  </ProtectedPage>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedPage>
                    <AnalyticsPage />
                  </ProtectedPage>
                }
              />
              <Route
                path="/advisor"
                element={
                  <ProtectedPage>
                    <AdvisorPage />
                  </ProtectedPage>
                }
              />

              <Route
                path="/upload"
                element={
                  <ProtectedPage>
                    <UploadPage />
                  </ProtectedPage>
                }
              />

              {/* ── 404 ── */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
