import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, Trash2, Edit3, X, Check,
  Coffee, Car, ShoppingCart, Zap, Dumbbell, Home, Plane, BookOpen, MoreHorizontal,
  Calendar, ChevronDown
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EXPENSE_CATEGORIES } from "@shared/schema";
import type { Expense } from "@shared/schema";

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

interface ExpenseFormData {
  amount: string;
  category: string;
  description: string;
  date: string;
}

const emptyForm: ExpenseFormData = {
  amount: "",
  category: "Food & Dining",
  description: "",
  date: new Date().toISOString().split("T")[0],
};

export default function Expenses() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const sym = user?.currencySymbol || "$";

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/expenses", data).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowForm(false);
        setForm(emptyForm);
      }, 1200);

      if (data.budgetExceeded) {
        toast({
          title: "Budget Exceeded!",
          description: `This expense pushed your monthly total (${sym}${data.monthTotal.toFixed(2)}) over your set limit of ${sym}${data.budgetAmount.toFixed(2)}.`,
          variant: "destructive"
        });
      } else {
        toast({ title: "Expense added!", description: "Your expense has been recorded." });
      }
    },
    onError: () => toast({ title: "Error", description: "Failed to add expense.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/expenses/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setEditId(null);
      setShowForm(false);
      setForm(emptyForm);
      toast({ title: "Expense updated!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/expenses/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.date) return;
    const data = { ...form, amount: parseFloat(form.amount) };
    if (editId) {
      updateMutation.mutate({ id: editId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (expense: Expense) => {
    setForm({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      date: expense.date,
    });
    setEditId(expense.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditId(null);
  };

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || e.category === filterCategory;
    const matchMonth = !filterMonth || e.date.startsWith(filterMonth);
    return matchSearch && matchCat && matchMonth;
  });

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Expense Management</h1>
            <p className="text-sm text-muted-foreground mt-1">{expenses.length} total expenses</p>
          </div>
          <motion.button
            data-testid="button-add-expense"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all text-sm"
          >
            <Plus size={18} />
            Add Expense
          </motion.button>
        </div>

        {/* Add/Edit form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              className="bg-card border border-card-border rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-foreground">{editId ? "Edit Expense" : "New Expense"}</h3>
                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Amount ({sym})</label>
                    <input
                      data-testid="input-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <div className="relative">
                      <select
                        data-testid="select-category"
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                      >
                        {EXPENSE_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <input
                      data-testid="input-description"
                      type="text"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="What did you spend on?"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date</label>
                    <input
                      data-testid="input-date"
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-xl border border-input text-foreground text-sm font-medium hover:bg-accent transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    data-testid="button-submit-expense"
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-all ${
                      submitSuccess
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25"
                        : "bg-gradient-to-r from-blue-500 to-violet-600 shadow-blue-500/25 hover:shadow-blue-500/40"
                    } disabled:opacity-70`}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : submitSuccess ? (
                      <><Check size={16} /> Saved!</>
                    ) : (
                      editId ? "Update Expense" : "Add Expense"
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-4 py-2.5 bg-card border border-card-border rounded-xl">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              data-testid="input-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
            />
          </div>
          <div className="relative">
            <select
              data-testid="select-filter-category"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 pr-8 bg-card border border-card-border rounded-xl text-foreground text-sm outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <input
            data-testid="input-filter-month"
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-4 py-2.5 bg-card border border-card-border rounded-xl text-foreground text-sm outline-none"
          />
        </div>

        {/* Summary */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{filtered.length} expense{filtered.length !== 1 ? "s" : ""} found</span>
            <span className="font-semibold text-foreground">Total: <span className="text-blue-400">{sym}{totalFiltered.toFixed(2)}</span></span>
          </div>
        )}

        {/* Expenses list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-card border border-card-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-card border border-card-border rounded-2xl"
          >
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Receipt size={28} className="text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold mb-2">No expenses found</p>
            <p className="text-muted-foreground text-sm">
              {search || filterCategory !== "All" || filterMonth
                ? "Try adjusting your filters"
                : "Add your first expense to get started"}
            </p>
          </motion.div>
        ) : (
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-card-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">Icon</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-card-border">
              <AnimatePresence>
                {filtered.map((expense, i) => {
                  const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal;
                  const color = CATEGORY_COLORS[expense.category] || "#94a3b8";
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.03 }}
                      data-testid={`row-expense-${expense.id}`}
                      className="grid grid-cols-2 sm:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-accent/30 transition-colors"
                    >
                      <div className="sm:col-span-1">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "20" }}>
                          <Icon size={16} style={{ color }} />
                        </div>
                      </div>
                      <div className="sm:col-span-4 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{expense.description}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{expense.category}</p>
                      </div>
                      <div className="hidden sm:block sm:col-span-3">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: color + "15", color }}>
                          {expense.category}
                        </span>
                      </div>
                      <div className="hidden sm:block sm:col-span-2">
                        <p className="text-sm text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <div className="sm:col-span-1 sm:text-right">
                        <p className="text-sm font-bold text-foreground">-{sym}{expense.amount.toFixed(2)}</p>
                      </div>
                      <div className="sm:col-span-1 sm:text-right flex justify-end gap-1">
                        <button
                          data-testid={`button-edit-${expense.id}`}
                          onClick={() => handleEdit(expense)}
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          data-testid={`button-delete-${expense.id}`}
                          onClick={() => deleteMutation.mutate(expense.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Receipt({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
      <path d="M16 8H8"/><path d="M16 12H8"/><path d="M12 16H8"/>
    </svg>
  );
}
