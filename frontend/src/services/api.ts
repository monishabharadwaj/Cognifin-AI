import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { Transaction, Budget, Goal, Trip, User, ChatMessage } from '@/types/finance';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const ML_SERVICE_BASE = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000';

class ApiClient {
  private api: AxiosInstance;
  private mlApi: AxiosInstance;

  constructor() {
    // Main API client
    this.api = axios.create({
      baseURL: API_BASE,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ML Service client
    this.mlApi = axios.create({
      baseURL: ML_SERVICE_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor to main API
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async register(name: string, email: string, password: string) {
    const response = await this.api.post<{ token: string; user: User }>('/auth/register', {
      name,
      email,
      password,
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.api.post<{ message: string }>('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  }

  logout() {
    this.setToken(null);
  }

  // Transaction endpoints
  async getTransactions() {
    const response = await this.api.get<Transaction[]>('/transactions');
    return response.data;
  }

  async createTransaction(data: Omit<Transaction, 'id'>) {
    const response = await this.api.post<Transaction>('/transactions', data);
    return response.data;
  }

  async updateTransaction(id: string, data: Partial<Transaction>) {
    const response = await this.api.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
  }

  async deleteTransaction(id: string) {
    await this.api.delete(`/transactions/${id}`);
  }

  // Budget endpoints
  async getBudgets() {
    const response = await this.api.get<Budget[]>('/budgets');
    return response.data;
  }

  async createBudget(data: Omit<Budget, 'id'>) {
    const response = await this.api.post<Budget>('/budgets', data);
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
    const response = await this.api.get<Goal[]>('/ai/savings-goals');
    return response.data;
  }

  async createGoal(data: Omit<Goal, 'id'>) {
    const response = await this.api.post<Goal>('/ai/savings-goals', data);
    return response.data;
  }

  async updateGoal(id: string, data: Partial<Goal>) {
    const response = await this.api.put<Goal>(`/ai/savings-goals/${id}`, data);
    return response.data;
  }

  // Trips endpoints
  async getTrips() {
    const response = await this.api.get<Trip[]>('/ai/trip-plans');
    return response.data;
  }

  async createTrip(data: Omit<Trip, 'id'>) {
    const response = await this.api.post<Trip>('/ai/trip-plans', data);
    return response.data;
  }

  // Analytics endpoints
  async getAnalyticsSummary() {
    const response = await this.api.get('/analytics/summary');
    return response.data;
  }

  async getAnalyticsCategories() {
    const response = await this.api.get('/analytics/categories');
    return response.data;
  }

  async getAnalyticsMonthly() {
    const response = await this.api.get('/analytics/monthly');
    return response.data;
  }

  async getAIDashboard() {
    const response = await this.api.get('/analytics/ai-dashboard');
    return response.data;
  }

  // AI endpoints (through main API)
  async chatWithAI(message: string, history: ChatMessage[]) {
    const response = await this.api.post<{ response: string }>('/ai/chat', {
      message,
      history,
    });
    return response.data;
  }

  async getFinancialAdvice() {
    const response = await this.api.post<{ advice: string }>('/ai/financial-advice');
    return response.data;
  }

  async getBudgetOptimization() {
    const response = await this.api.post<{ suggestions: string[] }>('/ai/budget-optimization');
    return response.data;
  }

  // ML Service endpoints (direct calls)
  async predictSpending(sequence: number[]) {
    const response = await this.mlApi.post('/predict_spending', { sequence });
    return response.data;
  }

  async analyzeTransaction(transactionAmount: number, sequence: number[]) {
    const response = await this.mlApi.post('/analyze_transaction', {
      transaction_amount: transactionAmount,
      sequence,
    });
    return response.data;
  }

  async getFinancialReport(transactions: any[]) {
    const response = await this.mlApi.post('/financial_report', { transactions });
    return response.data;
  }

  async financialChat(question: string, transactions: any[]) {
    const response = await this.mlApi.post('/financial_chat', {
      question,
      transactions,
    });
    return response.data;
  }

  async getBudgetAnalysis(transactions: any[], budgets: any) {
    const response = await this.mlApi.post('/budget_analysis', {
      transactions,
      budgets,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
