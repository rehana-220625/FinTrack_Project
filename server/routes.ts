import bcrypt from "bcryptjs";
import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertExpenseSchema,
  insertBudgetSchema,
} from "@shared/schema";
import { getCurrencyByCountry } from "@shared/currencies";
import session from "express-session";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const SESSION_FILE = path.join(process.cwd(), "sessions.json");

class FileStore extends session.Store {
  private sessions: Record<string, any> = {};

  constructor() {
    super();
    try {
      if (fs.existsSync(SESSION_FILE)) {
        this.sessions = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
      }
    } catch (err) {
      console.error("Failed to load sessions.json:", err);
    }
  }

  private saveSessions() {
    try {
      fs.writeFileSync(SESSION_FILE, JSON.stringify(this.sessions, null, 2));
    } catch (err) {
      console.error("Failed to save sessions.json:", err);
    }
  }

  get(sid: string, callback: (err: any, session?: session.SessionData | null) => void) {
    const sess = this.sessions[sid];
    if (sess) {
      callback(null, sess);
    } else {
      callback(null, null);
    }
  }

  set(sid: string, sess: session.SessionData, callback?: (err?: any) => void) {
    this.sessions[sid] = sess;
    this.saveSessions();
    if (callback) callback();
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    delete this.sessions[sid];
    this.saveSessions();
    if (callback) callback();
  }
}

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

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.set("trust proxy", 1);
  app.use(session({
    store: new FileStore(),
    secret: process.env.SESSION_SECRET || "walletwatch-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: result.error.issues[0].message });
      }

      const existing = await storage.getUserByUsername(
        result.data.username
      );

      if (existing) {
        return res
          .status(409)
          .json({ error: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(result.data.password, 10);

      const currencyInfo = getCurrencyByCountry(
        result.data.country || "United States"
      );

      const user = await storage.createUser({
        ...result.data,
        password: hashedPassword,
        currency: currencyInfo.code,
        currencySymbol: currencyInfo.symbol,
      });

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

      if (!user) {
        return res
          .status(401)
          .json({ error: "Invalid username or password" });
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return res
          .status(401)
          .json({ error: "Invalid username or password" });
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
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _, ...safeUser } = user;
    return res.json(safeUser);
  });

  app.get("/api/expenses", requireAuth, async (req, res) => {
    const expenses = await storage.getExpenses(req.session.userId!);
    return res.json(expenses);
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const result = insertExpenseSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
      const expense = await storage.createExpense(req.session.userId!, result.data);

      let budgetExceeded = false;
      let monthTotal = 0;
      let budgetAmount = 0;
      
      const now = new Date(expense.date);
      const budget = await storage.getBudget(req.session.userId!, now.getMonth() + 1, now.getFullYear());
      
      if (budget && budget.amount > 0) {
        const expenses = await storage.getExpenses(req.session.userId!);
        monthTotal = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() + 1 === now.getMonth() + 1 && d.getFullYear() === now.getFullYear();
        }).reduce((s, e) => s + e.amount, 0);

        if (monthTotal > budget.amount) {
          budgetExceeded = true;
          budgetAmount = budget.amount;
        }
      }

      return res.json({ ...expense, budgetExceeded, budgetAmount, monthTotal });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id as string);
      if (!expense || expense.userId !== req.session.userId) {
        return res.status(404).json({ error: "Expense not found" });
      }
      const updated = await storage.updateExpense(req.params.id as string, req.body);
      return res.json(updated);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id as string);
      if (!expense || expense.userId !== req.session.userId) {
        return res.status(404).json({ error: "Expense not found" });
      }
      await storage.deleteExpense(req.params.id as string);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/budgets", requireAuth, async (req, res) => {
    const budgets = await storage.getBudgets(req.session.userId!);
    return res.json(budgets);
  });

  app.get("/api/budgets/current", requireAuth, async (req, res) => {
    try {
      const now = new Date();
      const budget = await storage.getBudget(
        req.session.userId!,
        now.getMonth() + 1,
        now.getFullYear()
      );
      return res.json(budget || null);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/budgets", requireAuth, async (req, res) => {
    try {
      const result = insertBudgetSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: result.error.issues[0].message });
      }

      const budget = await storage.setBudget(
        req.session.userId!,
        result.data
      );

      return res.json(budget);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/budgets/generate", requireAuth, async (req, res) => {
    try {
      const { income } = req.body;
      if (!income || isNaN(Number(income))) {
        return res.status(400).json({ error: "Valid monthly income is required" });
      }
      
      const incomeNum = Number(income);
      
      // Smart AI heuristic based on actual user history
      const expenses = await storage.getExpenses(req.session.userId!);
      let categories: Record<string, number> = {};

      if (expenses.length > 0) {
        // Calculate historical category proportions
        const categoryTotals = expenses.reduce((acc: Record<string, number>, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {});
        
        const totalHistoricalSpend = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
        
        // Map historical proportions to the new income
        let remainingIncome = incomeNum;
        
        // Strongly recommend 20% minimum savings rule before allocating the rest
        const savingsTarget = Math.round(incomeNum * 0.20);
        categories["Savings"] = savingsTarget;
        remainingIncome -= savingsTarget;

        for (const [cat, amount] of Object.entries(categoryTotals)) {
          if (cat === "Savings") continue;
          
          const proportion = amount / totalHistoricalSpend;
          const allocated = Math.round(remainingIncome * proportion);
          categories[cat] = allocated;
        }
      } else {
        // Fallback to strict standard guidelines if no history exists
        categories = {
          "Housing": Math.round(incomeNum * 0.35),
          "Food & Dining": Math.round(incomeNum * 0.15),
          "Savings": Math.round(incomeNum * 0.20),
          "Transportation": Math.round(incomeNum * 0.10),
          "Shopping": Math.round(incomeNum * 0.10),
          "Entertainment": Math.round(incomeNum * 0.10),
        };
      }
      
      const totalAmount = Object.values(categories).reduce((a, b) => a + b, 0);

      return res.json({
        amount: totalAmount,
        categories: JSON.stringify(categories)
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const expenses = await storage.getExpenses(req.session.userId!);
      const now = new Date();
      const currentMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Calculate category spending
      const categoryTotals = currentMonthExpenses.reduce((acc: any, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});
      
      const highestCategory = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])[0] || "None";
      const highestAmount = categoryTotals[highestCategory] || 0;
      const highestPercentage = totalSpent > 0 ? Math.round((highestAmount / totalSpent) * 100) : 0;

      const lowerMessage = message.toLowerCase();
      let response = "I am an AI financial assistant. While I am still learning, I can provide insights on your total spending, budget status, category breakdowns, and advice on how to save. What would you like to know?";

      const budget = await storage.getBudget(req.session.userId!, now.getMonth() + 1, now.getFullYear());
      const budgetAmount = budget?.amount || 0;
      
      const greetings = ["hi", "hello", "hey", "greetings", "morning", "afternoon"];
      if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + " "))) {
        response = "Hello! I am your professional AI Financial Advisor. How may I assist you with your financial goals today?";
      } else if (lowerMessage.includes("budget")) {
        if (budgetAmount > 0) {
          const remaining = budgetAmount - totalSpent;
          response = `Your current monthly budget is set to $${budgetAmount}. You have spent $${totalSpent} so far, leaving you with $${remaining} for the rest of the month.`;
        } else {
          response = "You currently do not have a budget set for this month. I recommend using our AI Budget Generator on the Budgets page to create one based on your income!";
        }
      } else if (lowerMessage.includes("save") || lowerMessage.includes("reduce") || lowerMessage.includes("advice") || lowerMessage.includes("help")) {
        if (highestPercentage > 30) {
          const savingsAmount = Math.round(highestAmount * 0.15);
          response = `Based on my analysis, you spent ${highestPercentage}% of your money on ${highestCategory} this month. A professional recommendation is to reduce discretionary spending in this area by 15% to increase your savings by $${savingsAmount}.`;
        } else {
          response = "To optimize your savings, I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% strictly for savings. Try reviewing your subscriptions and dining expenses to find quick wins.";
        }
      } else if (lowerMessage.includes("where") || lowerMessage.includes("biggest") || lowerMessage.includes("most") || lowerMessage.includes("highest")) {
        if (totalSpent === 0) {
          response = "You haven't tracked any expenses this month yet. Once you add some transactions, I can analyze your top spending habits.";
        } else {
          response = `Your highest spending category this month is ${highestCategory} at $${highestAmount}. This represents ${highestPercentage}% of your total monthly expenditures.`;
        }
      } else if (lowerMessage.match(/\b(total|how much|spent)\b/)) {
        response = `You have spent a total of $${totalSpent} so far this month across ${currentMonthExpenses.length} transactions.`;
      } else {
        // Check for specific category questions
        const categories = ["Housing", "Food & Dining", "Transportation", "Shopping", "Entertainment", "Healthcare", "Travel", "Education", "Personal Care"];
        let foundCategory = false;
        
        for (const cat of categories) {
          if (lowerMessage.includes(cat.toLowerCase().split(" ")[0])) {
            const catTotal = categoryTotals[cat] || 0;
            response = `You have spent $${catTotal} on ${cat} this month.`;
            foundCategory = true;
            break;
          }
        }
        
        if (!foundCategory && lowerMessage.length > 10) {
            response = "That is an excellent question. While I don't have a specific answer for that exact query right now, I strongly suggest reviewing your detailed Reports dashboard to visualize your long-term trends. Is there anything specific about your monthly budget or top categories I can clarify?";
        }
      }

      return res.json({ response });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/subscriptions", requireAuth, async (req, res) => {
    try {
      const expenses = await storage.getExpenses(req.session.userId!);
      
      const expenseGroups = expenses.reduce((acc: any, e) => {
        const key = `${e.description.trim()}-${e.amount}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(e);
        return acc;
      }, {});

      const subscriptions = [];
      const now = new Date();

      for (const [key, group] of Object.entries<any[]>(expenseGroups)) {
        if (group.length > 1) {
          group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const latest = group[0];
          const latestDate = new Date(latest.date);
          
          const daysSinceLastPayment = (now.getTime() - latestDate.getTime()) / (1000 * 3600 * 24);
          
          if (daysSinceLastPayment <= 45) {
            const nextPaymentDate = new Date(latestDate);
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            
            subscriptions.push({
              id: key,
              name: latest.description,
              amount: latest.amount,
              category: latest.category,
              billingCycle: "Monthly",
              lastPaymentDate: latest.date,
              nextPaymentDate: nextPaymentDate.toISOString().split("T")[0]
            });
          }
        }
      }

      return res.json(subscriptions);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  if (await storage.isDataEmpty()) {
    const demoUser = await storage.getUserByUsername("demo");
    if (!demoUser) {
    const user = await storage.createUser({
      username: "demo",
      password: "demo123",
      name: "Alex Johnson",
      email: "alex@walletwatch.app",
      country: "United States",
      currency: "USD",
      currencySymbol: "$",
    }, true); 
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

    
    const user2 = await storage.createUser({
      username: "sarah",
      password: "sarah123",
      name: "Sarah Chen",
      email: "sarah@walletwatch.app",
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
  }

  return httpServer;
}