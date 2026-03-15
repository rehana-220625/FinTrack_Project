import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Receipt, PiggyBank, BarChart3, User, LogOut,
  Menu, X, Sun, Moon, Bell, ChevronRight, Zap, Shield
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { logout } from "@/lib/auth";
import { GravityModeButton } from "./GravityMode";
import { useToast } from "@/hooks/use-toast";

const baseNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/expenses", label: "Expenses", icon: Receipt },
  { path: "/budget", label: "Budget", icon: PiggyBank },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/profile", label: "Profile", icon: User },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });

  const navItems = user?.isAdmin
    ? [...baseNavItems, { path: "/admin", label: "Admin", icon: Shield }]
    : baseNavItems;

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast({ title: "Logged out", description: "See you soon!" });
  };

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
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

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed lg:relative lg:translate-x-0 z-50 h-full w-72 flex flex-col
          bg-card border-r border-card-border
          lg:flex
        `}
        style={{ transform: undefined }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-card-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-foreground">FinTrack</h1>
            <p className="text-xs text-muted-foreground">Smart Budget Control</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-card-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
            {user?.isAdmin && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 font-medium shrink-0">Admin</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Menu</p>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location === path || location.startsWith(path + "/");
            const isAdmin = path === "/admin";
            return (
              <Link key={path} href={path}>
                <motion.div
                  data-testid={`nav-${label.toLowerCase()}`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
                    ${isActive
                      ? isAdmin
                        ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/20"
                        : "bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-blue-400 border border-blue-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    className={isActive
                      ? isAdmin ? "text-red-400" : "text-blue-400"
                      : "text-muted-foreground group-hover:text-foreground"}
                  />
                  <span className="font-medium text-sm">{label}</span>
                  {isActive && (
                    <ChevronRight size={14} className={`ml-auto ${isAdmin ? "text-red-400" : "text-blue-400"}`} />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-card-border space-y-2">
          <GravityModeButton />
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full text-sm font-medium group"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center gap-4 px-6 border-b border-card-border bg-card/50 backdrop-blur-sm shrink-0">
          <button
            data-testid="button-menu"
            className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="hidden sm:block">
            {navItems.find(n => location.startsWith(n.path)) && (
              <h2 className="font-semibold text-foreground text-sm">
                {navItems.find(n => location.startsWith(n.path))?.label}
              </h2>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              data-testid="button-theme"
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              data-testid="button-notifications"
              className="relative p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
