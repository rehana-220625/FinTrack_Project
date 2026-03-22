import { type User, type InsertUser, type Expense, type InsertExpense, type Budget, type InsertBudget } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data.json");

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser, isAdmin?: boolean): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getExpenses(userId: string): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(userId: string, expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  getBudget(userId: string, month: number, year: number): Promise<Budget | undefined>;
  setBudget(userId: string, budget: InsertBudget): Promise<Budget>;
  getBudgets(userId: string): Promise<Budget[]>;
  getAllUsers(): Promise<User[]>;
  getAllExpenses(): Promise<Expense[]>;
  isDataEmpty(): boolean;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private budgets: Map<string, Budget> = new Map();

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        if (data.users) this.users = new Map(Object.entries(data.users));
        if (data.expenses) this.expenses = new Map(Object.entries(data.expenses));
        if (data.budgets) this.budgets = new Map(Object.entries(data.budgets));
      }
    } catch (err) {
      console.error("Failed to load data.json:", err);
    }
  }

  private saveData() {
    try {
      const data = {
        users: Object.fromEntries(this.users),
        expenses: Object.fromEntries(this.expenses),
        budgets: Object.fromEntries(this.budgets)
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Failed to save data.json:", err);
    }
  }

  isDataEmpty(): boolean {
    return this.users.size === 0 && this.expenses.size === 0 && this.budgets.size === 0;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser & { currency?: string; currencySymbol?: string }, isAdmin = false): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      avatar: null, 
      isAdmin,
      currency: insertUser.currency || "USD",
      currencySymbol: insertUser.currencySymbol || "$"
    };
    this.users.set(id, user);
    this.saveData();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    this.saveData();
    return updated;
  }

  async getExpenses(userId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(userId: string, expense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const newExpense: Expense = {
      ...expense,
      id,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.expenses.set(id, newExpense);
    this.saveData();
    return newExpense;
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    const updated = { ...expense, ...data };
    this.expenses.set(id, updated);
    this.saveData();
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const deleted = this.expenses.delete(id);
    if (deleted) this.saveData();
    return deleted;
  }

  async getBudget(userId: string, month: number, year: number): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(
      b => b.userId === userId && b.month === month && b.year === year
    );
  }

  async setBudget(userId: string, budget: InsertBudget): Promise<Budget> {
    const existing = await this.getBudget(userId, budget.month, budget.year);
    if (existing) {
      const updated = { ...existing, amount: budget.amount };
      this.budgets.set(existing.id, updated);
      this.saveData();
      return updated;
    }
    const id = randomUUID();
    const newBudget: Budget = { ...budget, id, userId };
    this.budgets.set(id, newBudget);
    this.saveData();
    return newBudget;
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(b => b.userId === userId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const storage = new MemStorage();
