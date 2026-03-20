import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  User,
  RefreshCw,
  Sparkles,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    label: "Spending analysis",
    text: "Analyse my spending patterns this month",
  },
  {
    icon: PiggyBank,
    label: "Saving tips",
    text: "Give me tips to improve my savings rate",
  },
  {
    icon: AlertTriangle,
    label: "Budget alerts",
    text: "Which categories am I overspending in?",
  },
  {
    icon: Sparkles,
    label: "Investment advice",
    text: "How should I allocate my savings for investment?",
  },
];

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

interface MessageBubbleProps {
  msg: Message;
}

function MessageBubble({ msg }: MessageBubbleProps) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser ? "bg-blue-600" : "bg-slate-700"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      <div
        className={`max-w-[78%] flex flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : msg.isError
                ? "bg-red-50 text-red-700 border border-red-200 rounded-tl-sm"
                : "bg-white border border-border text-foreground rounded-tl-sm shadow-sm"
          }`}
        >
          {msg.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm your AI Financial Advisor powered by FinanceAI's ML engine.\n\nAsk me anything about your finances — spending patterns, saving strategies, budget advice, or investment tips. I'll analyse your actual transaction data to give you personalised insights.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const result = await apiClient.financialChatML(trimmed, []);

      const raw = result as Record<string, unknown>;
      const responseText =
        (typeof raw?.response === "string" ? raw.response : null) ??
        (typeof raw?.answer === "string" ? raw.answer : null) ??
        (typeof raw?.message === "string" ? raw.message : null) ??
        "I received your message but couldn't generate a response. Please try again.";

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      const errorMsg: Message = {
        id: `e-${Date.now()}`,
        role: "assistant",
        content:
          "⚠️ I couldn't reach the AI service right now. Please make sure the ML service is running on port 8000 and try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast({
        title: "AI service unavailable",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Chat cleared. How can I help you with your finances today?",
        timestamp: new Date(),
      },
    ]);
    setInput("");
  };

  return (
    <div
      className="space-y-4 flex flex-col"
      style={{ height: "calc(100vh - 7rem)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Financial Chat
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Powered by FinanceAI ML Engine · Ask anything about your finances
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clearChat}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Clear Chat
        </Button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Main chat panel */}
        <Card className="flex-1 flex flex-col min-h-0 glass-card overflow-hidden">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.7,
                          delay,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="p-3 border-t bg-card flex gap-2 flex-shrink-0">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances… (Enter to send)"
              disabled={isTyping}
              className="flex-1 bg-secondary border-0 focus-visible:ring-1"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 flex-shrink-0"
            >
              {isTyping ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>

        {/* Quick prompts sidebar */}
        <div className="hidden md:flex flex-col gap-3 w-56 flex-shrink-0">
          <Card className="glass-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Questions
            </h3>
            <div className="space-y-2">
              {QUICK_PROMPTS.map(({ icon: Icon, label, text }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(text)}
                  disabled={isTyping}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="leading-snug">{label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Tips
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                Press{" "}
                <kbd className="bg-muted px-1 rounded text-[10px]">Enter</kbd>{" "}
                to send
              </li>
              <li>Ask about specific categories</li>
              <li>Request monthly comparisons</li>
              <li>Ask for savings goals advice</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
