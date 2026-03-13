import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@/types/finance";

const initialInsights = [
  { icon: Lightbulb, text: "Top spending category increased by 15% this month", color: "text-warning" },
  { icon: TrendingUp, text: "You're 80% towards your emergency fund goal! Keep it up!", color: "text-success" },
  { icon: AlertTriangle, text: "Consider reducing dining expenses by 10% to boost savings", color: "text-destructive" },
];

const mockResponses: Record<string, string> = {
  default:
    "Based on your spending patterns, I'd suggest:\n\n• **Reduce dining out** by ₹1,000/month\n• **Cancel unused subscriptions** to save ₹500\n• **Switch to a cheaper phone plan** for ₹1,000 savings\n\nThis would increase your savings rate from 15% to 20%! 🎯",
  save: "Great question! Looking at your data, you could save an additional **₹2,500/month** by optimizing your food and entertainment budgets. Want me to create a detailed savings plan?",
  invest:
    "With your risk profile and current savings, I'd recommend:\n\n1. **₹5,000/month** in index funds (low risk)\n2. **₹3,000/month** in balanced mutual funds\n3. Keep **6 months expenses** as emergency fund\n\nShall I help you set up automatic SIP investments?",
};

export default function AdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", role: "assistant", content: "Hi Alex! 👋 I'm your AI Financial Advisor. Ask me anything about your finances — from saving tips to investment strategies.", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    const lower = input.toLowerCase();
    const response = lower.includes("save") ? mockResponses.save : lower.includes("invest") ? mockResponses.invest : mockResponses.default;
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date().toISOString() }]);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">AI Financial Advisor</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat */}
        <Card className="glass-card lg:col-span-2 flex flex-col h-[600px]">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">AI Financial Advisor</span>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "gradient-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1" : ""}>
                        {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                          part.startsWith("**") && part.endsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : part
                        )}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="p-4 border-t flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask about your finances..." className="bg-secondary border-0" />
            <Button onClick={handleSend} className="gradient-primary text-primary-foreground shrink-0"><Send className="h-4 w-4" /></Button>
          </div>
        </Card>

        {/* Insights */}
        <Card className="glass-card p-5 h-fit">
          <h3 className="font-semibold text-sm mb-4">📊 Today's Insights</h3>
          <div className="space-y-4">
            {initialInsights.map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }} className="flex gap-3 p-3 rounded-xl bg-muted/50">
                <insight.icon className={`h-5 w-5 shrink-0 mt-0.5 ${insight.color}`} />
                <p className="text-sm text-muted-foreground">{insight.text}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
