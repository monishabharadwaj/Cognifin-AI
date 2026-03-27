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
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import type { Transaction } from "@/types/finance";

// ─── Floating Cognifin Node — Active Intelligence visual ─────────────────────

function FloatingCognifinNode() {
  return (
    <div className="relative flex items-center justify-center w-14 h-14 select-none shrink-0">
      {/* Outer orbit ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 54, height: 54, border: "1px solid rgba(16,185,129,0.3)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.9)" }} />
      </motion.div>
      {/* Purple counter-ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 40, height: 40, border: "1px dashed rgba(139,92,246,0.3)" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: "#8B5CF6", boxShadow: "0 0 6px rgba(139,92,246,0.9)" }} />
      </motion.div>
      {/* Core */}
      <motion.div
        className="absolute z-10 flex items-center justify-center w-9 h-9 rounded-full"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(139,92,246,0.2))",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 0 20px rgba(16,185,129,0.2), 0 0 20px rgba(139,92,246,0.15)",
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Brain className="h-4 w-4" style={{ color: "#10B981" }} />
      </motion.div>
    </div>
  );
}

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
    accent: "destructive",
    label: "Reduce Expenses",
    text: "Give me 5 specific and actionable tips to reduce my monthly expenses right now.",
  },
];

const ACCENT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  green: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  yellow: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
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
        return <strong key={segIdx} className="font-bold text-foreground">{seg.slice(2, -2)}</strong>;
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
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} w-full group`}
    >
      {/* Avatar */}
      <div
        className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-105 ${
          isUser ? "bg-gradient-to-br from-primary to-primary/80" : "bg-gradient-to-br from-indigo-500 to-purple-600"
        }`}
      >
        {isUser ? (
          <User className="h-5 w-5 text-primary-foreground" />
        ) : (
          <Brain className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Bubble + timestamp */}
      <div className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-5 py-3.5 text-[15px] leading-relaxed relative overflow-hidden ${
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-md"
              : msg.isError
                ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl rounded-tl-sm"
                : "bg-card text-card-foreground border border-border/50 rounded-2xl rounded-tl-sm shadow-sm"
          }`}
        >
          {/* Subtle gradient overlay for user message */}
          {isUser && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />}
          
          <div className="relative z-10 text-opacity-90">
            {renderMarkdown(msg.content)}
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground px-1.5 font-medium opacity-70 group-hover:opacity-100 transition-opacity">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
      transition={{ duration: 0.2 }}
      className="flex gap-3"
    >
      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
        <Brain className="h-5 w-5 text-white" />
      </div>
      <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center justify-center min-w-[80px]">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 0.15, 0.3].map((delay, i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.8, delay, ease: "easeInOut" }}
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
    "Hello! 👋 I'm your Cognifin Intelligence Advisor.\n\n" +
    "I've connected to your real-time transaction data and can provide deeply personalised insights on your spending habits, budgeting strategies, and investment opportunities.\n\n" +
    "Select a topic below or ask me anything to get started.",
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

  useEffect(() => {
    apiClient
      .getTransactions()
      .then((txs) => {
        if (Array.isArray(txs)) setTransactions(txs);
      })
      .catch(() => {
        console.warn("[AdvisorPage] Could not pre-load transactions.");
      });
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      // Small delay to ensure layout shifts have occurred
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 50);
    }
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

      let txList = transactions;
      if (txList.length === 0) {
        try {
          const fetched = await apiClient.getTransactions();
          if (Array.isArray(fetched) && fetched.length > 0) {
            txList = fetched;
            setTransactions(fetched);
          }
        } catch { }
      }

      const mlPayload = toMLTransactions(txList);

      try {
        const mlResult = await apiClient.financialChatML(trimmed, mlPayload);
        responseText = extractResponse(mlResult);
        if (responseText) mlSuccess = true;
      } catch (mlErr: unknown) {
        console.error("[Advisor] ML /financial_chat failed:", mlErr);
      }

      if (!mlSuccess) {
        try {
          const apiResult = await apiClient.chatWithAI(trimmed);
          const extracted = extractResponse(apiResult);
          if (extracted) responseText = extracted;
        } catch (apiErr: unknown) {
          console.error("[Advisor] Backend /ai/chat failed:", apiErr);
        }
      }

      if (!responseText) {
        const noTx = mlPayload.length === 0;
        responseText =
          (noTx
            ? "⚠️ No transactions found in your account yet.\n\nPlease log some transactions first so I have data to analyse.\n\n"
            : "") +
          "I couldn't reach the intelligence engine right now. Please ensure:\n" +
          "• Core backend is running (Port 5000)\n" +
          "• ML engine is active (Port 8000)\n\n" +
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
        content: "Chat cleared! 🔄 How can I assist you with your financial goals today?",
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setShowPrompts(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const displayName = user?.name?.split(' ')[0] ?? "there";

  return (
    <div className="flex flex-col gap-6 h-full pb-6">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-5 shadow-sm relative overflow-hidden" style={{ background: "rgba(13,20,28,0.8)", border: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(12px)" }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 10% 50%, rgba(16,185,129,0.06) 0%, transparent 60%)" }} />
        <div className="flex items-center gap-4 relative z-10">
          {/* Floating Cognifin Node */}
          <FloatingCognifinNode />
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-white">
              Cognifin Advisor
            </h1>
            <p className="text-sm mt-1 flex items-center gap-1.5 font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#10B981" }} /> Active Intelligence · Powered by your real financial data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-success ${isLoading ? 'opacity-100' : 'opacity-75'}`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-xs text-success font-bold tracking-wide uppercase">
              {isLoading ? "Processing" : "Online"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat} className="rounded-full shadow-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* ── Main Workspace ────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-6 min-h-0" style={{ height: "calc(100vh - 15rem)" }}>
        
        {/* ── Chat Canvas ─────────────────────────────────────────────────── */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border border-border/50 shadow-sm rounded-2xl bg-card">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/30 backdrop-blur-md z-10">
            <div className="h-4 w-4 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Secure Session Active</p>
              <p className="text-xs text-muted-foreground font-medium">End-to-end encrypted for {displayName}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scroll-smooth bg-gradient-to-b from-card to-muted/20">
            <div className="flex flex-col justify-end min-h-full space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}

                {isLoading && <TypingIndicator key="typing" />}
              </AnimatePresence>

              {/* Quick Prompts Grid */}
              <AnimatePresence>
                {showPrompts && !isLoading && messages.length <= 1 && (
                  <motion.div
                    key="quick-prompts"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
                    transition={{ duration: 0.3 }}
                    className="pt-6 pb-2"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-px bg-border flex-1" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
                        Suggested Queries
                      </p>
                      <div className="h-px bg-border flex-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {QUICK_PROMPTS.map(({ icon: Icon, accent, label, text }, idx) => {
                        const style = ACCENT_STYLES[accent];
                        return (
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 + 0.2 }}
                            key={label}
                            onClick={() => sendMessage(text)}
                            disabled={isLoading}
                            className={`flex flex-col px-4 py-4 rounded-xl text-left border bg-card hover:bg-muted/50 transition-all ${style.border} hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden`}
                          >
                            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 -mr-8 -mt-8 ${style.bg.replace('/10', '')}`} />
                            <div className={`h-10 w-10 rounded-xl ${style.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                              <Icon className={`h-5 w-5 ${style.text}`} />
                            </div>
                            <span className="text-[15px] font-bold text-foreground mb-1 z-10">{label}</span>
                            <span className="text-[11px] text-muted-foreground line-clamp-2 z-10 leading-relaxed font-medium">
                              {text}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty div for auto-scrolling to bottom rigidly */}
              <div ref={bottomRef} className="h-2" />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t border-border/50 z-10">
            <div className="relative flex items-center bg-muted/40 border border-border rounded-full shadow-inner focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all p-1">
              <div className="pl-4 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message Cognifin Advisor as ${displayName}...`}
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 px-4 text-[15px] placeholder:text-muted-foreground h-12"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="rounded-full w-12 h-12 p-0 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md mr-1 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <div className="text-center mt-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">
                Cognifin AI may produce inaccurate information about people, places, or facts.
              </p>
            </div>
          </div>
        </Card>

        {/* ── Helper Sidebar (Desktop Only) ──────────────────────────────── */}
        <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
          <Card className="p-5 border border-border/50 shadow-sm bg-gradient-to-br from-indigo-500/5 to-purple-500/5 backdrop-blur-sm rounded-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Lightbulb className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Pro Tips</h3>
            </div>
            <ul className="space-y-3 relative z-10">
              {[
                { icon: "⌨️", text: "Press Enter to send a message instantly." },
                { icon: "📈", text: "Ask for predictions based on previous spending." },
                { icon: "💡", text: "Inquire about tax-saving investment strategies." },
                { icon: "🔍", text: "Search through specific transaction histories." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground items-start">
                  <span className="text-base leading-none mt-0.5">{item.icon}</span>
                  <span className="leading-snug font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 border border-border/50 shadow-sm bg-card rounded-2xl flex-1">
             <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">System Status</h3>
            </div>
            <div className="space-y-3">
              {[
                { name: "Core Backend", status: "Active", dot: "bg-success" },
                { name: "ML Risk Engine", status: "Active", dot: "bg-success" },
                { name: "Encryption Key", status: "Valid", dot: "bg-success" },
              ].map((sys) => (
                <div key={sys.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                   <div className="flex items-center gap-2">
                     <div className={`h-2 w-2 rounded-full ${sys.dot}`}></div>
                     <span className="text-xs font-semibold text-foreground">{sys.name}</span>
                   </div>
                   <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{sys.status}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-6">
               <div className="w-full h-24 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center border border-slate-700 p-4 text-center shadow-inner relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                 <div className="relative z-10 flex flex-col items-center">
                   <ShieldAlert className="h-6 w-6 text-slate-400 mb-1 group-hover:text-primary transition-colors" />
                   <p className="text-xs text-slate-300 font-medium">Bank-Grade Encryption</p>
                 </div>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
