import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import type {
  Transaction,
  Budget,
  Goal,
  Trip,
  User,
  ChatMessage,
} from "@/types/finance";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
// ML service is ALWAYS routed through the Vite dev-server proxy at /ml
// The proxy strips /ml and forwards to http://127.0.0.1:8000
// We intentionally IGNORE VITE_ML_SERVICE_URL here because setting it to
// http://localhost:8000 re-introduces the CORS preflight 405 problem.
const ML_SERVICE_BASE = "/ml";
const IS_DEV =
  import.meta.env.DEV === true || import.meta.env.VITE_DEBUG === "true";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts the most human-readable error message from an Axios error.
 * Priority: server JSON message → network error → status text → generic fallback
 */
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ message?: string; error?: string }>;

    // 1. Server returned a JSON body with a message
    const serverMsg =
      axiosErr.response?.data?.message || axiosErr.response?.data?.error;
    if (serverMsg) return String(serverMsg);

    // 2. Network-level failure (no response at all)
    if (axiosErr.code === "ERR_NETWORK" || !axiosErr.response) {
      return (
        "Network Error — cannot reach the server. " +
        "Make sure the backend is running on port 5000 and try again."
      );
    }

    // 3. HTTP status text
    if (axiosErr.response?.statusText) {
      return `${axiosErr.response.status}: ${axiosErr.response.statusText}`;
    }

    // 4. Axios message (e.g. "timeout of 10000ms exceeded")
    if (axiosErr.message) return axiosErr.message;
  }

  // 5. Generic JS error
  if (error instanceof Error) return error.message;

  return "An unexpected error occurred.";
}

class ApiClient {
  private api: AxiosInstance;
  private mlApi: AxiosInstance;

  constructor() {
    // ── Main API client ──────────────────────────────────────────────────────
    this.api = axios.create({
      baseURL: API_BASE,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: false,
    });

    // ── ML Service client ────────────────────────────────────────────────────
    // ML Service client — routes through Vite proxy /ml → 127.0.0.1:8000
    // No auth token needed (ML service has no auth)
    // No withCredentials (same-origin via proxy)
    this.mlApi = axios.create({
      baseURL: ML_SERVICE_BASE,
      timeout: 60000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // ── Request interceptor: attach JWT + dev logging ────────────────────────
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (IS_DEV) {
          console.debug(
            `[API] ▶ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
            config.data ?? "",
          );
        }

        return config;
      },
      (error) => {
        console.error("[API] Request setup error:", error);
        return Promise.reject(new Error(extractErrorMessage(error)));
      },
    );

    // ── Response interceptor: logging + unified error shape ──────────────────
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (IS_DEV) {
          console.debug(
            `[API] ✅ ${response.status} ${response.config.url}`,
            response.data,
          );
        }
        return response;
      },
      (error: AxiosError<{ message?: string; error?: string }>) => {
        const status = error.response?.status;
        const message = extractErrorMessage(error);

        if (IS_DEV) {
          console.error(
            `[API] ❌ ${status ?? "NETWORK"} ${error.config?.url ?? ""}`,
            message,
            error.response?.data ?? "",
          );
        }

        // Token expired / invalid → force re-login
        if (status === 401) {
          localStorage.removeItem("auth_token");
          window.location.href = "/login";
        }

        // Re-throw with a clean, human-readable message
        return Promise.reject(new Error(message));
      },
    );
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem("auth_token", token);
      if (IS_DEV) console.debug("[API] 🔑 Token saved to localStorage");
    } else {
      localStorage.removeItem("auth_token");
      if (IS_DEV) console.debug("[API] 🔑 Token removed from localStorage");
    }
  }

  /**
   * GET /api/auth/me — fetch logged-in user profile.
   * Returns null instead of throwing if the endpoint doesn't exist (404).
   */
  async getMe(): Promise<{ id: string; name: string; email: string } | null> {
    try {
      const response = await this.api.get<{
        id: string;
        name: string;
        email: string;
      }>("/auth/me");
      return response.data;
    } catch (err: any) {
      // 404 means endpoint doesn't exist on this backend — return null gracefully
      if (err?.response?.status === 404 || err?.response?.status === 405)
        return null;
      throw err;
    }
  }

  // Auth endpoints
  // ── Auth ───────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    try {
      const response = await this.api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("/auth/login", { email, password });
      this.setToken(response.data.accessToken);
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  async register(name: string, email: string, password: string) {
    try {
      const response = await this.api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("/auth/register", { name, email, password });
      this.setToken(response.data.accessToken);
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  async forgotPassword(email: string) {
    try {
      const response = await this.api.post<{ message: string }>(
        "/auth/forgot-password",
        { email },
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  async resetPassword(token: string, password: string) {
    try {
      const response = await this.api.post<{ message: string }>(
        "/auth/reset-password",
        { token, password },
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  logout() {
    this.setToken(null);
  }

  // Transaction endpoints
  async getTransactions() {
    const response = await this.api.get<Transaction[]>("/transactions");
    return response.data;
  }

  async createTransaction(data: Omit<Transaction, "id">) {
    const response = await this.api.post<Transaction>("/transactions", data);
    return response.data;
  }

  async updateTransaction(id: string, data: Partial<Transaction>) {
    const response = await this.api.put<Transaction>(
      `/transactions/${id}`,
      data,
    );
    return response.data;
  }

  async deleteTransaction(id: string) {
    await this.api.delete(`/transactions/${id}`);
  }

  // Budget endpoints
  async getBudgets() {
    const response = await this.api.get<Budget[]>("/budgets");
    return response.data;
  }

  async createBudget(data: Omit<Budget, "id">) {
    const response = await this.api.post<Budget>("/budgets", data);
    return response.data;
  }

  async updateBudget(id: string, data: Partial<Budget>) {
    const response = await this.api.put<Budget>(`/budgets/${id}`, data);
    return response.data;
  }

  async deleteBudget(id: string) {
    await this.api.delete(`/budgets/${id}`);
  }

  // Goals endpoints
  async getGoals() {
    const response = await this.api.get<Goal[]>("/ai/savings-goals");
    return response.data;
  }

  async createGoal(data: Omit<Goal, "id">) {
    const response = await this.api.post<Goal>("/ai/savings-goals", data);
    return response.data;
  }

  async updateGoal(id: string, data: Partial<Goal>) {
    const response = await this.api.put<Goal>(`/ai/savings-goals/${id}`, data);
    return response.data;
  }

  // Trips endpoints
  async getTrips() {
    const response = await this.api.get<Trip[]>("/ai/trip-plans");
    return response.data;
  }

  async createTrip(data: Omit<Trip, "id">) {
    const response = await this.api.post<Trip>("/ai/trip-plans", data);
    return response.data;
  }

  // Analytics endpoints
  async getAnalyticsSummary() {
    const response = await this.api.get("/analytics/summary");
    return response.data;
  }

  async getAnalyticsCategories() {
    const response = await this.api.get("/analytics/categories");
    return response.data;
  }

  async getAnalyticsMonthly() {
    const response = await this.api.get("/analytics/monthly");
    return response.data;
  }

  async getAIDashboard() {
    const response = await this.api.get("/analytics/ai-dashboard");
    return response.data;
  }

  // ── AI Chat (ML Service) ──────────────────────────────────────────────────

  /**
   * POST /ml/financial_chat
   * Pydantic model on ML side requires BOTH `question` (str) and `transactions` (list).
   * Proxied through Vite /ml → http://127.0.0.1:8000 to bypass browser CORS.
   */
  async financialChatML(
    message: string,
    transactions: Record<string, unknown>[] = [],
  ): Promise<{ response: string }> {
    try {
      const payload = {
        question: String(message).trim(), // required string
        transactions: Array.isArray(transactions) ? transactions : [], // required list
      };

      if (IS_DEV) {
        console.debug("[ML] ▶ POST /financial_chat payload:", payload);
      }

      const response = await this.mlApi.post<{ response: string }>(
        "/financial_chat",
        payload,
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  /**
   * POST /ml/financial_report
   * Sends transactions list and gets back full financial analysis + insights.
   */
  async financialReportML(
    transactions: Record<string, unknown>[] = [],
  ): Promise<{ insights: string[]; advice: string }> {
    try {
      const response = await this.mlApi.post<{
        insights: string[];
        advice: string;
      }>("/financial_report", {
        transactions: Array.isArray(transactions) ? transactions : [],
      });
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  /**
   * POST /ml/budget_analysis
   */
  async budgetAnalysisML(
    transactions: Record<string, unknown>[] = [],
    budgets: Record<string, unknown> = {},
  ): Promise<{ budget_insights: unknown }> {
    try {
      const response = await this.mlApi.post<{ budget_insights: unknown }>(
        "/budget_analysis",
        { transactions, budgets },
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  // ── File Upload ───────────────────────────────────────────────────────────

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await this.api.post("/ai/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  }

  // AI endpoints (through main API)
  // Backend /api/ai/chat now accepts { question, transactions? }
  // It fetches transactions from DB automatically if none provided.
  async chatWithAI(message: string, _history?: ChatMessage[]) {
    const response = await this.api.post<{ response: string }>("/ai/chat", {
      question: String(message).trim(),
      message: String(message).trim(), // keep both for backward compat
      transactions: [], // backend will fetch from DB if empty
    });
    return response.data;
  }

  async getFinancialAdvice() {
    const response = await this.api.post<{ advice: string }>(
      "/ai/financial-advice",
    );
    return response.data;
  }

  async getBudgetOptimization() {
    const response = await this.api.post<{ suggestions: string[] }>(
      "/ai/budget-optimization",
    );
    return response.data;
  }

  // ── ML Service endpoints (all proxied through /ml Vite proxy) ────────────

  async predictSpending(sequence: number[]) {
    const response = await this.mlApi.post("/predict_spending", { sequence });
    return response.data;
  }

  async analyzeTransaction(transactionAmount: number, sequence: number[]) {
    const response = await this.mlApi.post("/analyze_transaction", {
      transaction_amount: transactionAmount,
      sequence,
    });
    return response.data;
  }

  async getFinancialReport(transactions: Record<string, unknown>[]) {
    const response = await this.mlApi.post("/financial_report", {
      transactions: Array.isArray(transactions) ? transactions : [],
    });
    return response.data;
  }

  async financialChat(
    question: string,
    transactions: Record<string, unknown>[],
  ) {
    const response = await this.mlApi.post("/financial_chat", {
      question: String(question).trim(),
      transactions: Array.isArray(transactions) ? transactions : [],
    });
    return response.data;
  }

  async getBudgetAnalysis(
    transactions: Record<string, unknown>[],
    budgets: Record<string, unknown>,
  ) {
    const response = await this.mlApi.post("/budget_analysis", {
      transactions: Array.isArray(transactions) ? transactions : [],
      budgets: budgets ?? {},
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
