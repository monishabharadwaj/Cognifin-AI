import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  User,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  PiggyBank,
  Sparkles,
  Zap,
  BarChart3,
  Target,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import type { Transaction } from "@/types/finance";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    accent: "blue",
    label: "Spending Analysis",
    text: "Analyse my spending patterns and tell me which categories I spend the most on.",
  },
  {
    icon: PiggyBank,
    accent: "green",
    label: "Savings Tips",
    text: "How can I improve my savings rate based on my current income and expenses?",
  },
  {
    icon: AlertTriangle,
    accent: "yellow",
    label: "Budget Check",
    text: "Which expense categories am I overspending in? Give me a detailed breakdown.",
  },
  {
    icon: Sparkles,
    accent: "purple",
    label: "Investment Advice",
    text: "Based on my savings and spending habits, how should I start investing?",
  },
  {
    icon: BarChart3,
    accent: "orange",
    label: "Monthly Review",
    text: "Give me a complete review of my finances this month — income, expenses, and savings.",
  },
  {
    icon: Target,
    accent: "red",
    label: "Reduce Expenses",
    text: "Give me 5 specific and actionable tips to reduce my monthly expenses right now.",
  },
];

const ACCENT_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-200",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
  },
  red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Renders a message string, converting **bold** markdown and newlines to JSX.
 */
function renderMarkdown(content: string) {
  return content.split("\n").map((line, lineIdx) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    const nodes = segments.map((seg, segIdx) => {
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={segIdx}>{seg.slice(2, -2)}</strong>;
      }
      return <span key={segIdx}>{seg}</span>;
    });
    return (
      <span key={lineIdx}>
        {nodes}
        {lineIdx < content.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

/**
 * Extracts the text response from whatever shape the ML service returns.
 */
function extractResponse(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (!raw || typeof raw !== "object") return "";
  const r = raw as Record<string, unknown>;
  const text =
    (typeof r.response === "string" ? r.response : null) ??
    (typeof r.answer === "string" ? r.answer : null) ??
    (typeof r.message === "string" ? r.message : null) ??
    (typeof r.result === "string" ? r.result : null) ??
    "";
  return text.trim();
}

/**
 * Converts a Transaction array into the plain-dict shape the ML
 * service expects: { amount, category, date, description, type }
 */
function toMLTransactions(txs: Transaction[]): Record<string, unknown>[] {
  return txs.map((t) => ({
    amount: Number(t.amount) || 0,
    category: String(t.category || "other"),
    date: String(t.date || new Date().toISOString().slice(0, 10)),
    description: String(t.description || ""),
    type: String(t.type || "expense"),
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${
          isUser ? "bg-blue-600" : "bg-slate-800"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Bubble + timestamp */}
      <div
        className={`flex flex-col gap-1 max-w-[78%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : msg.isError
                ? "bg-red-50 text-red-700 border border-red-200 rounded-tl-sm"
                : "bg-white text-foreground border border-border rounded-tl-sm shadow-sm"
          }`}
        >
          {renderMarkdown(msg.content)}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-2.5"
    >
      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          {[0, 0.18, 0.36].map((delay, i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-slate-400"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 0.65, delay }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! 👋 I'm your AI Financial Advisor, powered by FinanceAI's ML engine.\n\n" +
    "I connect directly to your real transaction data to give personalised insights on spending, savings, budgeting, and investments.\n\n" +
    "Pick a quick question below or type your own — I'm here to help!",
  timestamp: new Date(),
};

export default function AdvisorPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch the user's real transactions once on mount so we can
  // pass them to the ML service with every chat request.
  useEffect(() => {
    apiClient
      .getTransactions()
      .then((txs) => {
        if (Array.isArray(txs)) setTransactions(txs);
      })
      .catch(() => {
        // Non-fatal — chat still works, ML just gets an empty list
        console.warn("[AdvisorPage] Could not pre-load transactions.");
      });
  }, []);

  // Auto-scroll whenever messages or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setShowPrompts(false);

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      let responseText = "";
      let mlSuccess = false;

      // ── Step 1: ensure we have transactions loaded ──────────────────────────
      let txList = transactions;
      if (txList.length === 0) {
        try {
          const fetched = await apiClient.getTransactions();
          if (Array.isArray(fetched) && fetched.length > 0) {
            txList = fetched;
            setTransactions(fetched);
          }
        } catch {
          // non-fatal — ML backend will also fetch from DB
        }
      }

      const mlPayload = toMLTransactions(txList);

      // ── Step 2: try FastAPI ML service via Vite /ml proxy ──────────────────
      // POST /ml/financial_chat → http://127.0.0.1:8000/financial_chat
      // Pydantic: { question: str, transactions: list }
      try {
        const mlResult = await apiClient.financialChatML(trimmed, mlPayload);
        responseText = extractResponse(mlResult);
        if (responseText) mlSuccess = true;
      } catch (mlErr: unknown) {
        console.error(
          "[Advisor] ML /financial_chat failed:",
          mlErr instanceof Error ? mlErr.message : mlErr,
        );
      }

      // ── Step 3: fallback — Node.js backend /api/ai/chat ────────────────────
      // The backend now auto-fetches the user's transactions from DB.
      if (!mlSuccess) {
        try {
          const apiResult = await apiClient.chatWithAI(trimmed);
          const extracted = extractResponse(apiResult);
          if (extracted) responseText = extracted;
        } catch (apiErr: unknown) {
          console.error(
            "[Advisor] Backend /ai/chat failed:",
            apiErr instanceof Error ? apiErr.message : apiErr,
          );
        }
      }

      // ── Step 4: final fallback message ─────────────────────────────────────
      if (!responseText) {
        const noTx = mlPayload.length === 0;
        responseText =
          (noTx
            ? "⚠️ No transactions found in your account yet.\n\nPlease add some transactions first so I can analyse your finances.\n\n"
            : "") +
          "I couldn't reach the AI service right now. Please make sure:\n" +
          "• Backend is running on **port 5000**\n" +
          "• ML service is running on **port 8000**\n\n" +
          "Then try your question again.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
          isError: !mlSuccess && !responseText.length,
        },
      ]);

      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, transactions],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const clearChat = () => {
    setMessages([
      {
        ...WELCOME,
        id: `welcome-${Date.now()}`,
        content: "Chat cleared! 🔄 How can I help with your finances today?",
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setShowPrompts(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const displayName = user?.name ?? "there";

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold leading-tight">
              AI Financial Advisor
            </h1>
            <p className="text-xs text-muted-foreground">
              Powered by FinanceAI ML Engine · Real data · Personalised insights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-700 font-medium">
              {isLoading ? "Thinking…" : "Online"}
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={clearChat}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            New Chat
          </Button>
        </div>
      </div>

      {/* ── Main layout: chat + sidebar ───────────────────────────────────── */}
      <div
        className="flex flex-1 gap-4 min-h-0"
        style={{ height: "calc(100vh - 11rem)" }}
      >
        {/* ── Chat panel ─────────────────────────────────────────────────── */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-0 shadow-md">
          {/* Chat top bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 rounded-t-xl flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                AI Financial Advisor
              </p>
              <p className="text-[11px] text-slate-400">
                Chatting as {displayName}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-300">
                {isLoading ? "Thinking…" : "Ready"}
              </span>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {isLoading && <TypingIndicator key="typing" />}
            </AnimatePresence>

            {/* Quick prompts (shown until user sends first message) */}
            <AnimatePresence>
              {showPrompts && !isLoading && messages.length <= 1 && (
                <motion.div
                  key="quick-prompts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="pt-2"
                >
                  <p className="text-xs text-muted-foreground font-medium mb-3 text-center uppercase tracking-wide">
                    Quick questions to get started
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map(
                      ({ icon: Icon, accent, label, text }) => {
                        const style = ACCENT_STYLES[accent];
                        return (
                          <button
                            key={label}
                            onClick={() => sendMessage(text)}
                            disabled={isLoading}
                            className={`flex items-center gap-3 p-3 rounded-xl text-left border transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-muted/30 ${style.border}`}
                          >
                            <div
                              className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon className={`h-4 w-4 ${style.text}`} />
                            </div>
                            <span className="text-sm font-medium leading-snug">
                              {label}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="flex gap-2 p-3 border-t bg-white flex-shrink-0">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances… (Enter to send)"
              disabled={isLoading}
              className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 flex-shrink-0 shadow-sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-3 w-60 flex-shrink-0">
          {/* Quick prompts sidebar (desktop) */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Prompts
              </h3>
            </div>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map(({ icon: Icon, accent, label, text }) => {
                const style = ACCENT_STYLES[accent];
                return (
                  <button
                    key={label}
                    onClick={() => sendMessage(text)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div
                      className={`h-6 w-6 rounded-md ${style.bg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                    </div>
                    <span className="text-xs font-medium leading-snug group-hover:text-foreground transition-colors">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Tips card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                How to Use
              </h3>
            </div>
            <ul className="space-y-2">
              {[
                {
                  icon: "⌨️",
                  tip: (
                    <>
                      Press{" "}
                      <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono border">
                        Enter
                      </kbd>{" "}
                      to send
                    </>
                  ),
                },
                { icon: "📊", tip: "Ask about specific spending categories" },
                { icon: "📅", tip: "Request monthly or weekly comparisons" },
                { icon: "🎯", tip: "Ask for a personalised savings plan" },
                { icon: "💡", tip: "AI uses your real transaction data" },
                { icon: "🤖", tip: "Powered by LSTM + LLM ML engine" },
              ].map(({ icon, tip }, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="flex-shrink-0 mt-0.5">{icon}</span>
                  <span className="leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Connection status */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-green-500" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Services
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "Backend API", port: "5000", ok: true },
                { label: "ML Engine", port: "8000", ok: true },
              ].map(({ label, port, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    :{port}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
