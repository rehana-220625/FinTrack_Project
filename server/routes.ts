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

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// ================= MIDDLEWARE =================

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

// ================= MAIN FUNCTION =================

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.set("trust proxy", 1);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "fintrack-secret-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // ================= AUTH =================

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

  // ================= EXPENSES =================

  app.get("/api/expenses", requireAuth, async (req, res) => {
    const expenses = await storage.getExpenses(req.session.userId!);
    return res.json(expenses);
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const result = insertExpenseSchema.safeParse(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: result.error.issues[0].message });
      }

      const expense = await storage.createExpense(
        req.session.userId!,
        result.data
      );

      return res.json(expense);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ================= BUDGET =================

  app.get("/api/budgets", requireAuth, async (req, res) => {
    const budgets = await storage.getBudgets(req.session.userId!);
    return res.json(budgets);
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

  return httpServer;
}