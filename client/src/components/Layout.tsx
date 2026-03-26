import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Receipt, PiggyBank, BarChart3, User, LogOut,
  Menu, X, Sun, Moon, Bell, ChevronRight, Zap, Shield, Wallet, AlertCircle, CheckCircle2, Repeat
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "./ThemeProvider";
import { logout } from "@/lib/auth";
import { GravityModeButton } from "./GravityMode";
import { useToast } from "@/hooks/use-toast";

// API fetch functions (adjust endpoint as per your backend)
const fetchBudgetForUser = async () => {
  const res = await fetch("/api/budgets/current");
  if (!res.ok) throw new Error("Failed to fetch budget");
  return res.json(); // { amount: number }
};

const fetchExpensesForUser = async () => {
  const res = await fetch("/api/expenses");
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json(); // returns array
};

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/expenses", label: "Adding Expense", icon: Receipt },
  { path: "/budget", label: "Setting Budgets", icon: PiggyBank },
  { path: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/profile", label: "Profile", icon: User }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: user } = useQuery({ queryKey: ["/api/auth/me"], queryFn: async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  } });

  // Fetch dynamic budget & expenses (React Query v5 object form)
  const { data: budgetData } = useQuery({
    queryKey: ["/api/budgets/current"],
    queryFn: fetchBudgetForUser
  });

  const { data: expensesList = [] } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: fetchExpensesForUser
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const totalExpenses = (expensesList || []).filter((e: any) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  }).reduce((s: number, e: any) => s + e.amount, 0);

  const totalBudget = budgetData?.amount || 0;
  const sym = user?.currencySymbol || "$";

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast({ title: "Logged out", description: "See you soon!" });
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed lg:relative lg:translate-x-0 z-50 h-full w-72 flex flex-col bg-card border-r border-card-border"
        style={{ transform: undefined }}
      >
        <div className="flex items-center gap-3 p-6 border-b border-card-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Wallet size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-foreground">walletWatch</h1>
            <p className="text-xs text-muted-foreground">Smart Budget Control</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-card-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Menu
          </p>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive =
              location === path || location.startsWith(path + "/");
            return (
              <Link key={path} href={path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer ${
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium text-sm">{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-card-border space-y-2">
          <GravityModeButton />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center gap-4 px-6 border-b border-card-border bg-card/50">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-accent"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative p-2 rounded-xl hover:bg-accent focus:outline-none"
                >
                  <Bell size={18} />
                  {totalExpenses > totalBudget && totalBudget > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-4 py-3 text-sm flex flex-col gap-2">
                  {totalBudget > 0 ? (
                    totalExpenses > totalBudget ? (
                      <div className="flex items-start gap-2 text-red-500">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">Budget Exceeded</p>
                          <p className="text-xs text-muted-foreground mt-0.5">You are {sym}{(totalExpenses - totalBudget).toFixed(2)} over budget.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-emerald-500">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold">On Track</p>
                          <p className="text-xs text-muted-foreground mt-0.5">You have {sym}{(totalBudget - totalExpenses).toFixed(2)} remaining.</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="text-muted-foreground text-xs italic">Set a monthly budget to receive alerts.</p>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none">
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.name && <p className="font-medium">{user.name}</p>}
                    {user?.email && <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <motion.div key={location}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}