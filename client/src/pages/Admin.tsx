import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, Receipt, DollarSign, TrendingUp, Shield,
  Coffee, Car, ShoppingCart, Zap, Dumbbell, Home, Plane, BookOpen, MoreHorizontal
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Layout } from "@/components/Layout";

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

export default function Admin() {
  const { data: stats, isLoading: statsLoading } = useQuery<any>({ queryKey: ["/api/admin/stats"] });
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const { data: expenses = [], isLoading: expLoading } = useQuery<any[]>({ queryKey: ["/api/admin/expenses"] });

  const categoryData = stats?.categoryBreakdown
    ? Object.entries(stats.categoryBreakdown as Record<string, number>)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const userSpendData = users
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 8)
    .map(u => ({ name: u.name.split(" ")[0], amount: u.totalSpent }));

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? "—",
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      sub: "Registered accounts",
    },
    {
      label: "Total Expenses",
      value: stats?.totalExpenses ?? "—",
      icon: Receipt,
      gradient: "from-violet-500 to-purple-500",
      sub: "Across all users",
    },
    {
      label: "Total Tracked",
      value: stats ? `$${Number(stats.totalAmount).toFixed(2)}` : "—",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-500",
      sub: "All-time spending",
    },
    {
      label: "This Month",
      value: stats ? `$${Number(stats.thisMonthAmount).toFixed(2)}` : "—",
      icon: TrendingUp,
      gradient: "from-orange-500 to-amber-500",
      sub: "Current month total",
    },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Platform-wide overview and analytics</p>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              data-testid={`admin-stat-${card.label.toLowerCase().replace(/ /g, "-")}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="relative overflow-hidden bg-card border border-card-border rounded-2xl p-6"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl transform translate-x-8 -translate-y-8`} />
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg mb-4`}>
                <card.icon size={20} className="text-white" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {statsLoading ? <span className="inline-block w-20 h-7 bg-muted rounded-lg animate-pulse" /> : card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-1">Spending by Category</h3>
            <p className="text-sm text-muted-foreground mb-5">All users, all time</p>
            {statsLoading || categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">
                {statsLoading ? "Loading..." : "No data yet"}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {categoryData.map(({ name, value }) => {
                    const Icon = CATEGORY_ICONS[name] || MoreHorizontal;
                    return (
                      <div key={name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[name] || "#94a3b8" }} />
                          <span className="text-xs text-muted-foreground truncate">{name}</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground shrink-0">${Number(value).toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* User spending bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-1">Top Spenders</h3>
            <p className="text-sm text-muted-foreground mb-5">Total spending per user</p>
            {usersLoading || userSpendData.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">
                {usersLoading ? "Loading..." : "No users yet"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={userSpendData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" name="Spent" radius={[6, 6, 0, 0]}>
                    {userSpendData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#3b82f6" : "#6366f1"} fillOpacity={i === 0 ? 1 : 0.65} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Users table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-card-border rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-card-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">All Users</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{users.length} registered accounts</p>
            </div>
          </div>
          {usersLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">User</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2 text-center">Expenses</div>
                <div className="col-span-2 text-right">Total Spent</div>
                <div className="col-span-1 text-center">Role</div>
              </div>
              {users.map((u, i) => {
                const initials = u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <motion.div
                    key={u.id}
                    data-testid={`admin-user-row-${u.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-2 sm:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-accent/30 transition-colors"
                  >
                    <div className="sm:col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block sm:col-span-3">
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="hidden sm:block sm:col-span-2 text-center">
                      <span className="text-sm font-medium text-foreground">{u.expenseCount}</span>
                    </div>
                    <div className="sm:col-span-2 sm:text-right">
                      <p className="text-sm font-bold text-foreground">${Number(u.totalSpent).toFixed(2)}</p>
                    </div>
                    <div className="hidden sm:flex sm:col-span-1 justify-center">
                      {u.isAdmin ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">Admin</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">User</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent expenses across all users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-card-border rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-card-border">
            <h3 className="font-semibold text-foreground">Recent Transactions (All Users)</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Latest activity across the platform</p>
          </div>
          {expLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-card-border">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-3">User</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {expenses.slice(0, 20).map((e, i) => {
                const color = CATEGORY_COLORS[e.category] || "#94a3b8";
                return (
                  <motion.div
                    key={e.id}
                    data-testid={`admin-expense-row-${e.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-2 sm:grid-cols-12 gap-4 items-center px-6 py-3.5 hover:bg-accent/30 transition-colors"
                  >
                    <div className="sm:col-span-3">
                      <p className="text-xs font-medium text-foreground">{e.userName}</p>
                    </div>
                    <div className="sm:col-span-3 min-w-0">
                      <p className="text-sm text-foreground truncate">{e.description}</p>
                    </div>
                    <div className="hidden sm:block sm:col-span-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: color + "20", color }}>
                        {e.category}
                      </span>
                    </div>
                    <div className="hidden sm:block sm:col-span-2">
                      <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</p>
                    </div>
                    <div className="sm:col-span-2 sm:text-right">
                      <p className="text-sm font-bold text-foreground">-${Number(e.amount).toFixed(2)}</p>
                    </div>
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
