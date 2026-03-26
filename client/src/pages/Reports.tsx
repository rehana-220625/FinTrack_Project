import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Download, FileText, Table2, TrendingUp, TrendingDown, BarChart3, FileDown } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@shared/schema";

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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const makeTooltip = (sym: string) => ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-card-border rounded-xl px-4 py-3 shadow-xl">
        {label && <p className="text-xs text-muted-foreground mb-1.5">{label}</p>}
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

export default function Reports() {
  const { toast } = useToast();
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const sym = user?.currencySymbol || "$";
  const CustomTooltip = makeTooltip(sym);

  const now = new Date();

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const total = expenses.filter(e => {
      const ed = new Date(e.date);
      return ed.getMonth() + 1 === m && ed.getFullYear() === y;
    }).reduce((s, e) => s + e.amount, 0);
    return { month: MONTH_NAMES[d.getMonth()], amount: total, year: y };
  });

  const categoryData = Object.entries(
    expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const currMonth = now.getMonth() + 1;
  const currYear = now.getFullYear();
  const currExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === currMonth && d.getFullYear() === currYear;
  });
  const currTotal = currExpenses.reduce((s, e) => s + e.amount, 0);

  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === (prevD.getMonth() + 1) && d.getFullYear() === prevD.getFullYear();
  });
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  const monthChange = prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : 0;

  const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0);
  const avgMonthly = monthlyData.filter(m => m.amount > 0).length > 0
    ? totalAllTime / monthlyData.filter(m => m.amount > 0).length
    : 0;

  // Export CSV
  const exportCSV = () => {
    const rows = [["Date", "Description", "Category", "Amount"]];
    expenses.forEach(e => rows.push([e.date, e.description, e.category, e.amount.toString()]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "walletwatch-expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported!", description: "Your expense data has been downloaded." });
  };

  // Export PDF
  const exportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("walletWatch - Expense Report", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 28);
      doc.text(`User: ${user?.name || ""}`, 14, 35);

      // Summary section
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, 55);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryRows = [
        ["Total Expenses (All Time)", `${sym}${totalAllTime.toFixed(2)}`],
        ["This Month", `${sym}${currTotal.toFixed(2)}`],
        ["Average Monthly Spending", `${sym}${avgMonthly.toFixed(2)}`],
        ["Total Transactions", expenses.length.toString()],
      ];
      autoTable(doc, {
        startY: 60,
        head: [["Metric", "Value"]],
        body: summaryRows,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      // Category breakdown
      const afterSummary = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Category Breakdown", 14, afterSummary);

      const categoryRows = categoryData.map(c => [
        c.name,
        `${sym}${c.value.toFixed(2)}`,
        `${totalAllTime > 0 ? ((c.value / totalAllTime) * 100).toFixed(1) : "0"}%`,
      ]);
      autoTable(doc, {
        startY: afterSummary + 5,
        head: [["Category", "Total", "% of Spending"]],
        body: categoryRows,
        theme: "striped",
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 10 },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      // All transactions
      const afterCat = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("All Transactions", 14, afterCat);

      const txRows = expenses.map(e => [
        e.date,
        e.description,
        e.category,
        `${sym}${e.amount.toFixed(2)}`,
      ]);
      autoTable(doc, {
        startY: afterCat + 5,
        head: [["Date", "Description", "Category", "Amount"]],
        body: txRows,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 3: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `walletWatch Report • Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      }

      doc.save("walletwatch-report.pdf");
      toast({ title: "PDF exported!", description: "Your report has been downloaded." });
    } catch (err) {
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Analyze your spending patterns and trends</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              data-testid="button-export-csv"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-card-border bg-card text-foreground text-sm font-medium hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
            >
              <Table2 size={16} className="text-blue-400" />
              Export CSV
            </motion.button>
            <motion.button
              data-testid="button-export-pdf"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              <FileDown size={16} />
              Export PDF
            </motion.button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total All Time",
              value: `${sym}${totalAllTime.toFixed(2)}`,
              sub: `${expenses.length} transactions`,
              icon: BarChart3,
              gradient: "from-blue-500 to-cyan-500",
            },
            {
              label: "This Month",
              value: `${sym}${currTotal.toFixed(2)}`,
              sub: monthChange !== 0 ? `${monthChange > 0 ? "+" : ""}${monthChange.toFixed(1)}% vs last month` : "No previous data",
              icon: monthChange >= 0 ? TrendingUp : TrendingDown,
              gradient: monthChange > 20 ? "from-red-500 to-orange-500" : "from-violet-500 to-purple-500",
            },
            {
              label: "Avg Monthly",
              value: `${sym}${avgMonthly.toFixed(2)}`,
              sub: "Based on all data",
              icon: TrendingUp,
              gradient: "from-emerald-500 to-teal-500",
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-card-border rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <card.icon size={18} className="text-white" />
              </div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart - 12 months */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-1">Monthly Expenses (12 months)</h3>
            <p className="text-sm text-muted-foreground mb-5">Year-over-year spending overview</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Expenses" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill={i === monthlyData.length - 1 ? "#3b82f6" : "#6366f1"} fillOpacity={i === monthlyData.length - 1 ? 1 : 0.65} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie chart - all time categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-1">Spending by Category</h3>
            <p className="text-sm text-muted-foreground mb-5">All-time category breakdown</p>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
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
                  {categoryData.map(({ name, value }) => (
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
        </div>

        {/* Line chart - trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-card-border rounded-2xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-1">Monthly Trend</h3>
          <p className="text-sm text-muted-foreground mb-5">Spending trend over 12 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="amount" name="Expenses" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: "#8b5cf6" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-card-border rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-card-border">
            <h3 className="font-semibold text-foreground">Category Breakdown</h3>
            <p className="text-sm text-muted-foreground mt-0.5">All-time spending per category</p>
          </div>
          <div className="divide-y divide-card-border">
            {categoryData.map(({ name, value }, i) => {
              const pct = totalAllTime > 0 ? (value / totalAllTime) * 100 : 0;
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-6 py-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[name] || "#94a3b8" }} />
                      <span className="text-sm font-medium text-foreground">{name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                      <span className="font-semibold text-foreground">{sym}{value.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: CATEGORY_COLORS[name] || "#94a3b8" }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
