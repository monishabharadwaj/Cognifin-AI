import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { Eye, EyeOff, ShieldCheck, TrendingUp, PieChart, BrainCircuit, Zap, ArrowRight, Sparkles, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// ─── 3D Orbital Node ─────────────────────────────────────────────────────────

function CognifinOrbital() {
  return (
    <div className="relative flex items-center justify-center w-72 h-72 mx-auto select-none">
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 290, height: 290, background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ring 1 — slowest, purple */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 270, height: 270, border: "1px solid rgba(139,92,246,0.2)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
          style={{ background: "radial-gradient(circle, #8B5CF6, #7c3aed)", boxShadow: "0 0 12px rgba(139,92,246,0.8)" }} />
      </motion.div>

      {/* Ring 2 — medium, emerald, dashed */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 200, height: 200, border: "1px dashed rgba(16,185,129,0.3)" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 rounded-full"
          style={{ background: "radial-gradient(circle, #10B981, #059669)", boxShadow: "0 0 14px rgba(16,185,129,0.7)" }} />
      </motion.div>

      {/* Ring 3 — fast, cyan */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 140, height: 140, border: "1px solid rgba(34,211,238,0.2)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
          style={{ background: "radial-gradient(circle, #22d3ee, #0891b2)", boxShadow: "0 0 10px rgba(34,211,238,0.7)" }} />
      </motion.div>

      {/* Central brain core */}
      <motion.div
        className="absolute z-20 flex items-center justify-center w-20 h-20 rounded-full"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(139,92,246,0.2))",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 0 40px rgba(16,185,129,0.2), 0 0 40px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <BrainCircuit className="h-9 w-9" style={{ color: "#10B981" }} />
      </motion.div>
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.07)" }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "20" }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
      toast({ title: "Welcome back to Cognifin! 👋" });
      setTimeout(() => navigate("/dashboard"), 100);
    } catch {
      toast({ title: "Login failed", description: error || "Invalid credentials", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ background: "#0B1218" }}>

      {/* ── LEFT HERO — 75% ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-3/4 relative overflow-hidden flex-col items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #0B1218 0%, #0d1a24 40%, #0f1d28 70%, #0c1520 100%)",
        }}
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)", filter: "blur(60px)" }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center max-w-2xl px-12 gap-10"
        >
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10B981, #8B5CF6)", boxShadow: "0 0 30px rgba(16,185,129,0.4), 0 0 30px rgba(139,92,246,0.3)" }}>
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-white tracking-tight">Cognifin</p>
              <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: "#10B981" }}>AI Wealth Intelligence</p>
            </div>
          </div>

          {/* 3D Orbital */}
          <CognifinOrbital />

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Know your money,
            </h1>
            <h2 className="text-5xl font-bold leading-tight" style={{
              background: "linear-gradient(90deg, #10B981, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              grow your wealth.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mt-4 max-w-lg mx-auto">
              AI-driven insights that analyse your spending, detect anomalies, and keep you on track — all in real time.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <StatChip icon={TrendingUp} label="Smart Forecasting" value="Powered by LSTM" color="#10B981" />
            <StatChip icon={PieChart} label="Expense Analysis" value="Category Insights" color="#8B5CF6" />
            <StatChip icon={ShieldCheck} label="Security" value="256-bit Encrypted" color="#22d3ee" />
            <StatChip icon={Zap} label="AI Alerts" value="Real-Time Flags" color="#F59E0B" />
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT AUTH SIDEBAR — 25% ─────────────────────────────────── */}
      <div
        className="w-full lg:w-1/4 flex flex-col items-center justify-center px-6 py-10 relative"
        style={{
          background: "rgba(13,20,28,0.95)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Subtle top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)" }} />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-[280px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8 gap-2 text-center">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl mb-1"
              style={{ background: "linear-gradient(135deg, #10B981, #8B5CF6)" }}>
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <p className="text-xl font-bold text-white">Cognifin</p>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "#10B981" }} />
              Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1">Access your financial hub</p>
          </div>

          {/* Social auth */}
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              onClick={() => toast({ title: "Connect Google OAuth on your backend to enable this." })}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl text-sm font-semibold text-slate-300 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => toast({ title: "Connect Facebook OAuth on your backend to enable this." })}
              className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl text-sm font-semibold text-slate-300 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-2 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Email + Password form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 rounded-xl text-sm text-white placeholder:text-slate-600 transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</Label>
                <Link to="/forgot-password" className="text-[11px] font-semibold hover:opacity-80 transition-opacity" style={{ color: "#10B981" }}>
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 rounded-xl text-sm text-white placeholder:text-slate-600 pr-10 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-0.5 h-9 w-9 text-slate-500 hover:text-slate-300 rounded-lg"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 group relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #10B981, #8B5CF6)", boxShadow: "0 4px 20px rgba(16,185,129,0.25), 0 4px 20px rgba(139,92,246,0.15)" }}
              whileHover={{ scale: 1.01, boxShadow: "0 6px 30px rgba(16,185,129,0.35), 0 6px 30px rgba(139,92,246,0.25)" }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)" }} />
              {isLoading ? (
                <><span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> Signing in...</>
              ) : (
                <><span>Sign In</span> <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            No account?{" "}
            <Link to="/register" className="font-bold hover:opacity-80 transition-opacity" style={{ color: "#8B5CF6" }}>
              Create one free
            </Link>
          </p>

          {/* Footer trust */}
          <div className="mt-7 flex items-center justify-center gap-4 text-slate-600">
            <div className="flex items-center gap-1 text-[10px] font-medium">
              <ShieldCheck className="h-3 w-3" /> AES-256
            </div>
            <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex items-center gap-1 text-[10px] font-medium">
              <Zap className="h-3 w-3" /> AI-Powered
            </div>
            <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex items-center gap-1 text-[10px] font-medium">
              <Sparkles className="h-3 w-3" /> Real-Time
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
