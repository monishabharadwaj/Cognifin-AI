import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { BrainCircuit, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const strength = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? "strong" : password.length >= 6 ? "medium" : "weak";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters", variant: "destructive" });
      return;
    }
    try {
      await register(name, email, password);
      toast({ title: "Welcome to Cognifin! 🎉", description: "Your account has been created. Please sign in." });
      navigate("/login");
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
      {/* Premium Abstract Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[460px] relative z-10"
      >
        <div className="flex flex-col items-center justify-center gap-4 mb-8 text-center">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-xl mb-1" style={{ background: "linear-gradient(135deg, #14b8a6, #0f766e)", boxShadow: "0 8px 24px rgba(20,184,166,0.3)" }}>
            <BrainCircuit className="h-8 w-8 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight" style={{ background: "linear-gradient(90deg, #14b8a6, #0891b2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Cognifin</h1>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1.5">Create your account</p>
          </div>
        </div>

        <Card className="p-8 sm:p-10 border-border/40 shadow-2xl shadow-primary/5 bg-card/60 backdrop-blur-2xl rounded-[32px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-semibold text-sm">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Alex Johnson" 
                className="bg-background/50 border-input/50 focus:bg-background h-12 px-4 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold text-sm">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="alex@cognifin.ai" 
                className="bg-background/50 border-input/50 focus:bg-background h-12 px-4 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-semibold text-sm">Password</Label>
              <div className="relative group">
                <Input 
                  id="password" 
                  type={showPw ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="bg-background/50 border-input/50 focus:bg-background h-12 px-4 pr-12 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1.5 h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg" 
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {password && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength === "strong" ? "w-full bg-success" : strength === "medium" ? "w-2/3 bg-warning" : "w-1/3 bg-destructive"}`} />
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${strength === "strong" ? "text-success" : strength === "medium" ? "text-warning" : "text-destructive"}`}>
                    {strength}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-foreground font-semibold text-sm">Confirm Password</Label>
              <Input 
                id="confirm" 
                type="password" 
                value={confirmPw} 
                onChange={(e) => setConfirmPw(e.target.value)} 
                placeholder="••••••••" 
                className="bg-background/50 border-input/50 focus:bg-background h-12 px-4 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <Button type="submit" className="w-full h-12 mt-2 text-[15px] rounded-xl font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #14b8a6, #0f766e)", boxShadow: "0 4px 20px rgba(20,184,166,0.3)" }} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin duration-500 rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-[15px] font-medium text-muted-foreground mt-8">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors border-b border-primary/30 pb-0.5 hover:border-primary">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
