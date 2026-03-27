import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Plane,
  Bot,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Upload,
  Settings,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { path: "/budget", label: "Budgeting", icon: PiggyBank },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/trips", label: "Trips", icon: Plane },
  { path: "/analytics", label: "Analytics", icon: Activity },
  { path: "/advisor", label: "AI Advisor", icon: Bot },
  { path: "/upload", label: "Documents", icon: Upload },
];

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold select-none flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #14b8a6, #0f766e)", boxShadow: "0 2px 8px rgba(20,184,166,0.3)" }}>
      {initials || "U"}
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayPhone = (user as any)?.phone || null;
  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "";

  const DropdownContents = () => (
    <>
      <div className="px-3 py-2">
        <p className="text-sm font-semibold truncate leading-none mb-1">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
        
        {displayPhone ? (
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded uppercase font-bold tracking-wider">Phone</span>
            {displayPhone}
          </p>
        ) : (
          <Link to="/profile" className="text-[11px] text-primary hover:text-primary/80 mt-2 inline-block font-medium">
            + Add phone number
          </Link>
        )}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link to="/profile" className="w-full flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={handleLogout}
        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </DropdownMenuItem>
    </>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-10 border-b border-white/[0.03]">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 relative group" 
             style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}>
          <div className="absolute inset-0 rounded-xl pulse-glow-emerald opacity-50" />
          <BarChart3 className="h-6 w-6 text-white relative z-10" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-display font-black text-white text-2xl tracking-tight leading-none uppercase">
            Cognifin
          </p>
          <p className="text-[10px] font-bold text-[#10B981] mt-1.5 uppercase tracking-[0.2em]">
            Wealth Intelligence
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className="group block relative"
            >
              <motion.div
                whileHover={{ rotateX: -10, rotateY: 5, translateZ: 10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ perspective: 1000 }}
                className={[
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden",
                  active
                    ? "text-white"
                    : "text-slate-500 hover:text-[#10B981]",
                ].join(" ")}
              >
                {/* Active Neon Strip & Glass Highlight */}
                {active && (
                  <>
                    <motion.div 
                      layoutId="active-strip"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#10B981] rounded-r-full neon-strip-emerald z-20"
                    />
                    <motion.div
                      layoutId="active-highlight"
                      className="absolute inset-0 bg-white/[0.03] backdrop-blur-md border border-white/[0.05] rounded-xl z-0"
                    />
                  </>
                )}
                
                <Icon 
                  strokeWidth={1.2}
                  className={[
                    "h-5 w-5 flex-shrink-0 transition-all duration-300 relative z-10",
                    active ? "text-[#10B981]" : "group-hover:text-[#10B981] grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100"
                  ].join(" ")} 
                />
                <span className="relative z-10 tracking-wide">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className="px-4 py-6 border-t border-white/[0.03] bg-black/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-all text-left group border border-transparent hover:border-white/[0.05]">
              <UserAvatar name={displayName} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-[#10B981] transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-semibold">
                  Cognifin Pro
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60 mb-2 glass-card border-white/[0.1] shadow-2xl">
            <DropdownContents />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-col flex-shrink-0 border-r border-sidebar-border shadow-2xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="absolute top-6 right-4 z-50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground/60 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between border-b bg-background/80 backdrop-blur-md px-6 gap-4 flex-shrink-0 sticky top-0 z-30 supports-[backdrop-filter]:bg-background/60">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-full"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page title — derived from current path */}
          <h1 className="font-display font-bold text-xl hidden sm:block tracking-tight text-foreground">
            {NAV_ITEMS.find((n) => n.path === location.pathname)?.label ?? "Cognifin Overview"}
          </h1>

          <div className="flex items-center gap-4 ml-auto">
            {/* Action icons could go here (notifications, etc) */}

            {/* Desktop user info */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full border border-border/50 hover:bg-muted/50 transition-colors shadow-sm bg-card">
                  <UserAvatar name={displayName} />
                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-sm font-semibold leading-tight text-foreground">
                      {displayName}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 shadow-xl rounded-xl">
                <DropdownContents />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content with Framer Motion transitions */}
        <main className="flex-1 overflow-auto bg-muted/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-4 md:p-8 h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
