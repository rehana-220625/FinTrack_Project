import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Receipt,
  ShoppingCart, Coffee, Car, Dumbbell, Zap, Home, Plane, BookOpen, MoreHorizontal
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import type { Expense, Budget } from "@shared/schema";

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-card-border rounded-xl px-4 py-3 shadow-xl">
        {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
            {p.name}: ${Number(p.value).toFixed(2)}
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

  const { data: expenses = [], isLoading: expLoading } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const { data: budget } = useQuery<Budget | null>({ queryKey: ["/api/budgets/current"] });
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const sym = user?.currencySymbol || "$";

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const budgetAmount = budget?.amount || 0;
  const remaining = budgetAmount - totalExpenses;
  const budgetUsedPct = budgetAmount ? Math.min((totalExpenses / budgetAmount) * 100, 100) : 0;

  // Budget alert notification (fires once per session when data is loaded)
  useEffect(() => {
    if (alertedRef.current || !budget || expenses.length === 0) return;
    if (budgetUsedPct >= 100) {
      alertedRef.current = true;
      toast({
        title: "🚨 Budget Exceeded!",
        description: `You've spent $${totalExpenses.toFixed(2)} — $${(totalExpenses - budgetAmount).toFixed(2)} over your $${budgetAmount.toFixed(2)} budget.`,
        variant: "destructive",
      });
    } else if (budgetUsedPct >= 80) {
      alertedRef.current = true;
      toast({
        title: "⚠️ Budget Warning",
        description: `You've used ${budgetUsedPct.toFixed(0)}% of your budget. Only $${remaining.toFixed(2)} remaining.`,
      });
    }
  }, [budgetUsedPct, budget, expenses.length]);

  // Category breakdown
  const categoryData = Object.entries(
    monthExpenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Monthly bar data (last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const total = expenses.filter(e => {
      const ed = new Date(e.date);
      return ed.getMonth() + 1 === m && ed.getFullYear() === y;
    }).reduce((s, e) => s + e.amount, 0);
    return { month: monthNames[d.getMonth()], amount: total };
  });

  // Spending trend (line chart)
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const dayStr = d.toISOString().split("T")[0];
    const total = expenses.filter(e => e.date === dayStr).reduce((s, e) => s + e.amount, 0);
    return {
      day: `${d.getDate()}/${d.getMonth() + 1}`,
      amount: total,
    };
  });

  const recentExpenses = expenses.slice(0, 5);

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good morning, {user?.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            testId="card-total-expenses"
            title="Monthly Expenses"
            value={`${sym}${totalExpenses.toFixed(2)}`}
            subtitle={`${monthExpenses.length} transactions`}
            icon={Receipt}
            gradient="from-blue-500 to-cyan-500"
            change={{ positive: false, value: "This month" }}
          />
          <StatCard
            testId="card-budget"
            title="Monthly Budget"
            value={`${sym}${budgetAmount.toFixed(2)}`}
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
                <h3 className="font-semibold text-foreground">Budget Overview</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  ${totalExpenses.toFixed(2)} spent of ${budgetAmount.toFixed(2)}
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
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-1">Spending by Category</h3>
            <p className="text-sm text-muted-foreground mb-5">This month's breakdown</p>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No expenses this month
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryData.slice(0, 5).map(({ name, value }) => (
                    <div key={name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[name] || "#94a3b8" }} />
                        <span className="text-xs text-muted-foreground truncate">{name}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground shrink-0">${value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Bar chart */}
          <motion.div
            data-gravity
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-1">Monthly Expenses</h3>
            <p className="text-sm text-muted-foreground mb-5">Last 6 months</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Expenses" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill={i === monthlyData.length - 1 ? "#3b82f6" : "#6366f1"} fillOpacity={i === monthlyData.length - 1 ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Line chart */}
        <motion.div
          data-gravity
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-card-border rounded-2xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-1">Spending Trend</h3>
          <p className="text-sm text-muted-foreground mb-5">Daily spending over the last 30 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "currentColor" }} className="text-muted-foreground" interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="amount" name="Expenses" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
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
