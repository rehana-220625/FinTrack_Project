import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertExpenseSchema, insertBudgetSchema } from "@shared/schema";
import { getCurrencyByCountry } from "@shared/currencies";
import session from "express-session";
import { randomUUID } from "crypto";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admin only" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.set("trust proxy", 1);
  app.use(session({
    secret: process.env.SESSION_SECRET || "fintrack-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
      const existing = await storage.getUserByUsername(result.data.username);
      if (existing) return res.status(409).json({ error: "Username already taken" });
      const currencyInfo = getCurrencyByCountry(result.data.country || "United States");
      const userWithCurrency = {
        ...result.data,
        currency: currencyInfo.code,
        currencySymbol: currencyInfo.symbol,
      };
      const user = await storage.createUser(userWithCurrency);
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    return res.json({ success: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password: _, ...safeUser } = user;
    return res.json(safeUser);
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const { name, email, avatar, password, country } = req.body;
      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (avatar) updates.avatar = avatar;
      if (password) updates.password = password;
      if (country) {
        updates.country = country;
        const currencyInfo = getCurrencyByCountry(country);
        updates.currency = currencyInfo.code;
        updates.currencySymbol = currencyInfo.symbol;
      }
      const user = await storage.updateUser(req.session.userId!, updates);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Expenses routes
  app.get("/api/expenses", requireAuth, async (req, res) => {
    const expenses = await storage.getExpenses(req.session.userId!);
    return res.json(expenses);
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const result = insertExpenseSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
      const expense = await storage.createExpense(req.session.userId!, result.data);
      return res.json(expense);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense || expense.userId !== req.session.userId) {
        return res.status(404).json({ error: "Expense not found" });
      }
      const updated = await storage.updateExpense(req.params.id, req.body);
      return res.json(updated);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense || expense.userId !== req.session.userId) {
        return res.status(404).json({ error: "Expense not found" });
      }
      await storage.deleteExpense(req.params.id);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Budget routes
  app.get("/api/budgets", requireAuth, async (req, res) => {
    const budgets = await storage.getBudgets(req.session.userId!);
    return res.json(budgets);
  });

  app.get("/api/budgets/current", requireAuth, async (req, res) => {
    const now = new Date();
    const budget = await storage.getBudget(req.session.userId!, now.getMonth() + 1, now.getFullYear());
    return res.json(budget || null);
  });

  app.post("/api/budgets", requireAuth, async (req, res) => {
    try {
      const result = insertBudgetSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
      const budget = await storage.setBudget(req.session.userId!, result.data);
      return res.json(budget);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const expenses = await storage.getAllExpenses();
      const totalRevenue = expenses.reduce((s, e) => s + e.amount, 0);
      const now = new Date();
      const thisMonth = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === now.getMonth() + 1 && d.getFullYear() === now.getFullYear();
      });
      const thisMonthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

      const categoryBreakdown = expenses.reduce((acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});

      return res.json({
        totalUsers: users.length,
        totalExpenses: expenses.length,
        totalAmount: totalRevenue,
        thisMonthAmount: thisMonthTotal,
        categoryBreakdown,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const expenses = await storage.getAllExpenses();
      const result = users.map(u => {
        const { password: _, ...safeUser } = u;
        const userExpenses = expenses.filter(e => e.userId === u.id);
        return {
          ...safeUser,
          expenseCount: userExpenses.length,
          totalSpent: userExpenses.reduce((s, e) => s + e.amount, 0),
        };
      });
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/expenses", requireAdmin, async (req, res) => {
    try {
      const expenses = await storage.getAllExpenses();
      const users = await storage.getAllUsers();
      const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
      const result = expenses.map(e => ({ ...e, userName: userMap[e.userId] || "Unknown" }));
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Seed demo user on first startup
  const demoUser = await storage.getUserByUsername("demo");
  if (!demoUser) {
    const user = await storage.createUser({
      username: "demo",
      password: "demo123",
      name: "Alex Johnson",
      email: "alex@fintrack.app",
      country: "United States",
      currency: "USD",
      currencySymbol: "$",
    }, true); // isAdmin = true
    const expenses = [
      { amount: 85.50, category: "Food & Dining", description: "Grocery shopping at Whole Foods", date: "2026-03-10" },
      { amount: 45.00, category: "Transportation", description: "Monthly bus pass", date: "2026-03-08" },
      { amount: 299.99, category: "Shopping", description: "New running shoes", date: "2026-03-07" },
      { amount: 15.99, category: "Entertainment", description: "Netflix subscription", date: "2026-03-06" },
      { amount: 120.00, category: "Health & Fitness", description: "Gym membership", date: "2026-03-05" },
      { amount: 52.30, category: "Food & Dining", description: "Dinner at Italian bistro", date: "2026-03-04" },
      { amount: 89.00, category: "Bills & Utilities", description: "Electricity bill", date: "2026-03-03" },
      { amount: 200.00, category: "Travel", description: "Flight to NYC", date: "2026-03-01" },
      { amount: 35.00, category: "Education", description: "Udemy course", date: "2026-02-28" },
      { amount: 67.80, category: "Food & Dining", description: "Coffee & lunch meetings", date: "2026-02-25" },
      { amount: 180.00, category: "Shopping", description: "Home decor", date: "2026-02-22" },
      { amount: 55.00, category: "Transportation", description: "Uber rides", date: "2026-02-20" },
      { amount: 25.00, category: "Entertainment", description: "Movie tickets", date: "2026-02-18" },
      { amount: 145.00, category: "Bills & Utilities", description: "Internet & phone bill", date: "2026-02-15" },
      { amount: 78.40, category: "Food & Dining", description: "Weekend brunch", date: "2026-02-10" },
    ];
    for (const exp of expenses) {
      await storage.createExpense(user.id, exp);
    }
    await storage.setBudget(user.id, { month: 3, year: 2026, amount: 2000 });
    await storage.setBudget(user.id, { month: 2, year: 2026, amount: 1800 });

    // Seed a second regular user for admin demo
    const user2 = await storage.createUser({
      username: "sarah",
      password: "sarah123",
      name: "Sarah Chen",
      email: "sarah@fintrack.app",
      country: "United Kingdom",
      currency: "GBP",
      currencySymbol: "£",
    });
    const expenses2 = [
      { amount: 120.00, category: "Food & Dining", description: "Weekly groceries", date: "2026-03-11" },
      { amount: 75.00, category: "Transportation", description: "Taxi rides this week", date: "2026-03-09" },
      { amount: 450.00, category: "Shopping", description: "Laptop accessories", date: "2026-03-06" },
      { amount: 12.99, category: "Entertainment", description: "Spotify Premium", date: "2026-03-05" },
      { amount: 95.00, category: "Bills & Utilities", description: "Water & gas bill", date: "2026-03-03" },
    ];
    for (const exp of expenses2) {
      await storage.createExpense(user2.id, exp);
    }
    await storage.setBudget(user2.id, { month: 3, year: 2026, amount: 1500 });
  }

  return httpServer;
}
