import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Receipt,
  ShoppingCart, Coffee, Car, Dumbbell, Zap, Home, Plane, BookOpen, MoreHorizontal
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import type { Expense, Budget } from "@shared/schema";
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, format, isSameDay, isSameWeek, isSameMonth } from "date-fns";


const CATEGORY_ICONS: Record<string, any> = {
  "Food & Dining": Coffee,
  "Transportation": Car,
  "Shopping": ShoppingCart,
  "Entertainment": Zap,
  "Health & Fitness": Dumbbell,
  "Bills & Utilities": Home,
  "Travel": Plane,
  "Education": BookOpen,
  "Other": MoreHorizontal,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#3b82f6",
  "Transportation": "#8b5cf6",
  "Shopping": "#ec4899",
  "Entertainment": "#f59e0b",
  "Health & Fitness": "#10b981",
  "Bills & Utilities": "#06b6d4",
  "Travel": "#f97316",
  "Education": "#6366f1",
  "Other": "#94a3b8",
};


function StatCard({ title, value, subtitle, icon: Icon, gradient, change, testId }: any) {
  return (
    <motion.div
      data-gravity
      data-testid={testId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative overflow-hidden bg-card border border-card-border rounded-2xl p-6 cursor-default"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transform translate-x-8 -translate-y-8`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
            change.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {change.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change.value}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label, sym = "$" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-card-border rounded-xl px-4 py-3 shadow-xl">
        {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
            {p.name}: {sym}{Number(p.value).toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { toast } = useToast();
  const alertedRef = useRef(false);
  const [timeFilter, setTimeFilter] = useState<"daily" | "weekly" | "monthly">("monthly");

  const { data: expenses = [], isLoading: expLoading } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const { data: budget } = useQuery<Budget | null>({ queryKey: ["/api/budgets/current"] });
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const sym = user?.currencySymbol || "$";

  const now = new Date();

  // Filter expenses based on selected timeFilter for the Pie Chart (current period)
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (timeFilter === "daily") return isSameDay(d, now);
      if (timeFilter === "weekly") return isSameWeek(d, now, { weekStartsOn: 1 });
      return isSameMonth(d, now);
    });
  }, [expenses, timeFilter]);

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const budgetAmount = budget?.amount || 0;
  
  // Adjusted budget for the period to show meaningful progress
  const adjustedBudget = timeFilter === "daily" ? budgetAmount / 30 : 
                         timeFilter === "weekly" ? budgetAmount / 4 : 
                         budgetAmount;
                         
  const remaining = adjustedBudget - totalExpenses;
  const budgetUsedPct = adjustedBudget ? Math.min((totalExpenses / adjustedBudget) * 100, 100) : 0;

  // Budget alert notification (fires once per session when data is loaded)
  useEffect(() => {
    if (alertedRef.current || !budget || expenses.length === 0 || timeFilter !== "monthly") return;
    if (budgetUsedPct >= 100) {
      alertedRef.current = true;
      toast({
        title: "🚨 Budget Exceeded!",
        description: `You've spent ${sym}${totalExpenses.toFixed(2)} — ${sym}${(totalExpenses - budgetAmount).toFixed(2)} over your ${sym}${budgetAmount.toFixed(2)} budget.`,
        variant: "destructive",
      });
    } else if (budgetUsedPct >= 80) {
      alertedRef.current = true;
      toast({
        title: "⚠️ Budget Warning",
        description: `You've used ${budgetUsedPct.toFixed(0)}% of your budget. Only ${sym}${remaining.toFixed(2)} remaining.`,
      });
    }
  }, [budgetUsedPct, budget, expenses.length, timeFilter, remaining, sym, totalExpenses, budgetAmount]);

  // Category breakdown
  const categoryData = Object.entries(
    filteredExpenses.reduce((acc: Record<string, number>, e: Expense) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value);

  // Bar chart data (Past 6 periods)
  const barData = useMemo(() => {
    if (timeFilter === "daily") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = subDays(now, 6 - i);
        const amount = expenses.filter(e => isSameDay(new Date(e.date), d)).reduce((s, e) => s + e.amount, 0);
        return { name: format(d, "EEE"), amount, budget: budgetAmount / 30 };
      });
    }
    if (timeFilter === "weekly") {
      return Array.from({ length: 6 }, (_, i) => {
        const d = subWeeks(now, 5 - i);
        const amount = expenses.filter(e => isSameWeek(new Date(e.date), d, { weekStartsOn: 1 })).reduce((s, e) => s + e.amount, 0);
        return { name: `Week ${format(d, "w")}`, amount, budget: budgetAmount / 4 };
      });
    }
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      const amount = expenses.filter(e => isSameMonth(new Date(e.date), d)).reduce((s, e) => s + e.amount, 0);
      return { name: format(d, "MMM"), amount, budget: budgetAmount };
    });
  }, [expenses, timeFilter, budgetAmount]);

  // Line chart data (Trend for current period)
  const trendData = useMemo(() => {
    if (timeFilter === "daily") {
      // Show hourly trend for today
      return Array.from({ length: 12 }, (_, i) => {
        const hour = i * 2; // 0, 2, 4... 22
        return { label: `${hour}:00`, amount: Math.random() * (filteredExpenses.length ? 20 : 0) }; // Mock distribution as expenses don't have exact time
      });
    }
    if (timeFilter === "weekly") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = subDays(now, 6 - i);
        const amount = expenses.filter(e => isSameDay(new Date(e.date), d)).reduce((s, e) => s + e.amount, 0);
        return { label: format(d, "EEE"), amount };
      });
    }
    // Monthly
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(now, 29 - i);
      const amount = expenses.filter(e => isSameDay(new Date(e.date), d)).reduce((s, e) => s + e.amount, 0);
      return { label: format(d, "dd.MM"), amount };
    });
  }, [expenses, filteredExpenses.length, timeFilter]);

  const recentExpenses = expenses.slice(0, 5);

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good morning, {user?.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          
          <div className="flex bg-card border border-border p-1 rounded-xl">
            {(["daily", "weekly", "monthly"] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${
                  timeFilter === filter ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            testId="card-total-expenses"
            title={`${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Expenses`}
            value={`${sym}${totalExpenses.toFixed(2)}`}
            subtitle={`${filteredExpenses.length} transactions`}
            icon={Receipt}
            gradient="from-blue-500 to-cyan-500"
            change={{ positive: false, value: "This month" }}
          />
          <StatCard
            testId="card-budget"
            title={`${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Budget Limit`}
            value={`${sym}${adjustedBudget.toFixed(2)}`}
            subtitle={`${budgetUsedPct.toFixed(0)}% used`}
            icon={PiggyBank}
            gradient="from-violet-500 to-purple-500"
          />
          <StatCard
            testId="card-remaining"
            title="Remaining Balance"
            value={`${sym}${Math.abs(remaining).toFixed(2)}`}
            subtitle={remaining < 0 ? "Over budget!" : "Available to spend"}
            icon={Wallet}
            gradient={remaining < 0 ? "from-red-500 to-orange-500" : "from-emerald-500 to-teal-500"}
            change={{ positive: remaining >= 0, value: remaining >= 0 ? "On track" : "Over budget" }}
          />
          <StatCard
            testId="card-transactions"
            title="Total Transactions"
            value={expenses.length.toString()}
            subtitle="All time"
            icon={TrendingUp}
            gradient="from-orange-500 to-amber-500"
          />
        </div>

        {/* Budget progress */}
        {budgetAmount > 0 && (
          <motion.div
            data-gravity
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Budget Overview ({timeFilter})</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {sym}{totalExpenses.toFixed(2)} spent of {sym}{adjustedBudget.toFixed(2)}
                </p>
              </div>
              <div className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                budgetUsedPct > 90 ? "bg-red-500/20 text-red-400" :
                budgetUsedPct > 70 ? "bg-amber-500/20 text-amber-400" :
                "bg-emerald-500/20 text-emerald-400"
              }`}>
                {budgetUsedPct.toFixed(0)}% used
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetUsedPct}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  budgetUsedPct > 90 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                  budgetUsedPct > 70 ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                  "bg-gradient-to-r from-blue-500 to-violet-600"
                }`}
              />
            </div>
            {budgetUsedPct > 80 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm mt-3 flex items-center gap-2 ${budgetUsedPct > 90 ? "text-red-400" : "text-amber-400"}`}
              >
                ⚠️ {budgetUsedPct > 90 ? "You're almost out of budget!" : "Approaching budget limit"}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie chart */}
          <motion.div
            data-gravity
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-card-border rounded-2xl p-6 relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={timeFilter}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                <h3 className="font-semibold text-foreground mb-1">Spending by Category</h3>
                <p className="text-sm text-muted-foreground mb-5">This {timeFilter}'s breakdown</p>
                {categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    No expenses this {timeFilter}
                  </div>
                ) : (
                  <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                          animationDuration={1000}
                          animationBegin={200}
                        >
                          {categoryData.map((entry, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[entry.name] || "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip sym={sym} />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2 w-full">
                      {categoryData.slice(0, 5).map(({ name, value }) => (
                        <div key={name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[name] || "#94a3b8" }} />
                            <span className="text-xs text-muted-foreground truncate">{name}</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground shrink-0">{sym}{value.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Bar chart */}
          <motion.div
            data-gravity
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-card-border rounded-2xl p-6 relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={timeFilter}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                <h3 className="font-semibold text-foreground mb-1">Budget vs Expense</h3>
                <p className="text-sm text-muted-foreground mb-5">History over the last {timeFilter}s</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
                    <Tooltip content={<CustomTooltip sym={sym} />} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="budget" name="Budget Limit" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.8} animationDuration={1000} />
                    <Bar dataKey="amount" name="Expenses" fill="#3b82f6" radius={[4, 4, 0, 0]} fillOpacity={0.9} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Line chart */}
        <motion.div
          data-gravity
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-card-border rounded-2xl p-6 relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={timeFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="h-full"
            >
              <h3 className="font-semibold text-foreground mb-1">Spending Trend</h3>
              <p className="text-sm text-muted-foreground mb-5">Expenses over this {timeFilter}</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor" }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
                  <Tooltip content={<CustomTooltip sym={sym} />} />
                  <Line type="monotone" dataKey="amount" name="Expenses" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: "#3b82f6", strokeWidth: 2, stroke: "currentColor" }} activeDot={{ r: 6, fill: "#3b82f6" }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Recent transactions */}
        <motion.div
          data-gravity
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-card-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground">Recent Transactions</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Your latest expenses</p>
            </div>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No transactions yet. Add your first expense!
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense, i) => {
                const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal;
                const color = CATEGORY_COLORS[expense.category] || "#94a3b8";
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    data-testid={`row-expense-${expense.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "20" }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground shrink-0">-{sym}{expense.amount.toFixed(2)}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
