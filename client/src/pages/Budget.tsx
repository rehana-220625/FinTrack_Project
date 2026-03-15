import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Edit3, Save } from "lucide-react";
import { Layout } from "@/components/Layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Budget, Expense } from "@shared/schema";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function BudgetPage() {
  const { toast } = useToast();
  const now = new Date();
  const [editingMonth, setEditingMonth] = useState<{ month: number; year: number } | null>(null);
  const [budgetInput, setBudgetInput] = useState("");

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({ queryKey: ["/api/budgets"] });
  const { data: expenses = [] } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const sym = user?.currencySymbol || "$";

  const setBudgetMutation = useMutation({
    mutationFn: (data: { month: number; year: number; amount: number }) =>
      apiRequest("POST", "/api/budgets", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      setEditingMonth(null);
      toast({ title: "Budget saved!", description: "Your monthly budget has been updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save budget.", variant: "destructive" }),
  });

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }).reverse();

  const getBudget = (month: number, year: number) =>
    budgets.find(b => b.month === month && b.year === year);

  const getExpenses = (month: number, year: number) =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

  const currentBudget = getBudget(now.getMonth() + 1, now.getFullYear());
  const currentExpenses = getExpenses(now.getMonth() + 1, now.getFullYear());
  const currentSpent = currentExpenses.reduce((s, e) => s + e.amount, 0);
  const currentBudgetAmount = currentBudget?.amount || 0;
  const remaining = currentBudgetAmount - currentSpent;
  const pct = currentBudgetAmount > 0 ? Math.min((currentSpent / currentBudgetAmount) * 100, 100) : 0;

  const handleSaveBudget = () => {
    if (!editingMonth || !budgetInput) return;
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) return;
    setBudgetMutation.mutate({ ...editingMonth, amount });
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Set and manage your monthly spending limits</p>
        </div>

        {/* Current month hero */}
        <motion.div
          data-gravity
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl p-8 border ${
            pct > 90 ? "border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10" :
            pct > 70 ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10" :
            "border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-violet-500/10"
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#3b82f6", transform: "translate(50%, -50%)" }} />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
              </p>
              <h2 className="text-4xl font-bold text-foreground mb-1">
                {sym}{currentBudgetAmount > 0 ? currentBudgetAmount.toFixed(2) : "—"}
              </h2>
              <p className="text-sm text-muted-foreground">Monthly Budget</p>
            </div>

            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{sym}{currentSpent.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Spent</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className={`text-2xl font-bold ${remaining < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {remaining < 0 ? "-" : ""}{sym}{Math.abs(remaining).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{remaining < 0 ? "Over budget" : "Remaining"}</p>
              </div>
            </div>

            <button
              data-testid="button-edit-current-budget"
              onClick={() => {
                setEditingMonth({ month: now.getMonth() + 1, year: now.getFullYear() });
                setBudgetInput(currentBudgetAmount ? currentBudgetAmount.toString() : "");
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-foreground hover:bg-white/15 transition-all text-sm font-medium"
            >
              <Edit3 size={15} />
              {currentBudgetAmount > 0 ? "Edit Budget" : "Set Budget"}
            </button>
          </div>

          {/* Progress bar */}
          {currentBudgetAmount > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{pct.toFixed(0)}% of budget used</span>
                {pct > 90 && (
                  <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                    <AlertTriangle size={12} /> Over limit warning
                  </span>
                )}
                {pct <= 70 && currentBudgetAmount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                    <CheckCircle size={12} /> On track
                  </span>
                )}
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className={`h-full rounded-full ${
                    pct > 90 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                    pct > 70 ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                    "bg-gradient-to-r from-blue-500 to-violet-500"
                  }`}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Edit budget modal */}
        <AnimatePresence>
          {editingMonth && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              className="bg-card border border-card-border rounded-2xl p-6 shadow-xl"
            >
              <h3 className="font-semibold text-foreground mb-1">
                Set Budget for {MONTH_NAMES[editingMonth.month - 1]} {editingMonth.year}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Enter your spending limit for this month</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    data-testid="input-budget-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    onKeyDown={e => e.key === "Enter" && handleSaveBudget()}
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMonth(null)}
                  className="px-4 py-2.5 rounded-xl border border-input text-muted-foreground text-sm hover:bg-accent transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  data-testid="button-save-budget"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveBudget}
                  disabled={setBudgetMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-70"
                >
                  {setBudgetMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save size={16} /> Save Budget</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monthly history */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Budget History</h2>
          <div className="space-y-3">
            {months.map(({ month, year }) => {
              const budget = getBudget(month, year);
              const monthExpList = getExpenses(month, year);
              const spent = monthExpList.reduce((s, e) => s + e.amount, 0);
              const budgetAmt = budget?.amount || 0;
              const p = budgetAmt > 0 ? Math.min((spent / budgetAmt) * 100, 100) : 0;
              const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
              const isOver = budgetAmt > 0 && spent > budgetAmt;

              return (
                <motion.div
                  key={`${year}-${month}`}
                  data-gravity
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-card border rounded-2xl p-5 transition-all ${
                    isCurrentMonth ? "border-blue-500/30" : "border-card-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isOver ? "bg-red-500/15" : budgetAmt > 0 ? "bg-emerald-500/15" : "bg-muted"
                      }`}>
                        {isOver ? (
                          <TrendingDown size={18} className="text-red-400" />
                        ) : (
                          <TrendingUp size={18} className={budgetAmt > 0 ? "text-emerald-400" : "text-muted-foreground"} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {MONTH_NAMES[month - 1]} {year}
                          {isCurrentMonth && <span className="ml-2 text-xs text-blue-400 font-normal">(current)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{monthExpList.length} expenses</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{sym}{spent.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">of {sym}{budgetAmt > 0 ? budgetAmt.toFixed(2) : "—"}</p>
                      </div>
                      <button
                        data-testid={`button-edit-budget-${year}-${month}`}
                        onClick={() => {
                          setEditingMonth({ month, year });
                          setBudgetInput(budgetAmt ? budgetAmt.toString() : "");
                        }}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                  {budgetAmt > 0 && (
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p > 100 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                          p > 70 ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                          "bg-gradient-to-r from-blue-500 to-violet-500"
                        }`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  )}
                  {!budgetAmt && (
                    <p className="text-xs text-muted-foreground italic">No budget set for this month</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
