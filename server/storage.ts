import { type User, type InsertUser, type Expense, type InsertExpense, type Budget, type InsertBudget } from "@shared/schema";
import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// 1. Connect to MongoDB
const MONGODB_URI = "mongodb://n221024_db_user:GJ1QRdNymHuBmUGF@ac-h1voymz-shard-00-00.iorr3sp.mongodb.net:27017,ac-h1voymz-shard-00-01.iorr3sp.mongodb.net:27017,ac-h1voymz-shard-00-02.iorr3sp.mongodb.net:27017/?ssl=true&replicaSet=atlas-ahnxv2-shard-0&authSource=admin&appName=Cluster0"

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 2. Define Mongoose Schemas and Models

interface IUserDocument extends User, Document {
  id: string;
}

const userSchema = new Schema<IUserDocument>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  country: { type: String, default: "United States" },
  currency: { type: String, default: "USD" },
  currencySymbol: { type: String, default: "$" }
});

interface IExpenseDocument extends Expense, Document {
  id: string;
}

const expenseSchema = new Schema<IExpenseDocument>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  createdAt: { type: String, required: true }
});

interface IBudgetDocument extends Budget, Document {
  id: string;
}

const budgetSchema = new Schema<IBudgetDocument>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  amount: { type: Number, required: true },
  categories: { type: String, default: null }
});

const UserModel = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
const ExpenseModel = mongoose.models.Expense || mongoose.model<IExpenseDocument>("Expense", expenseSchema);
const BudgetModel = mongoose.models.Budget || mongoose.model<IBudgetDocument>("Budget", budgetSchema);

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
  isDataEmpty(): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  constructor() {
    this.migrateDataIfNeeded();
  }

  private async migrateDataIfNeeded() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
          console.log("MongoDB is empty. Migrating data from data.json...");
          const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

          if (data.users && Object.keys(data.users).length > 0) {
            const usersArray = Object.values(data.users);
            await UserModel.insertMany(usersArray);
            console.log(`Migrated ${usersArray.length} users.`);
          }
          if (data.expenses && Object.keys(data.expenses).length > 0) {
            const expensesArray = Object.values(data.expenses);
            await ExpenseModel.insertMany(expensesArray);
            console.log(`Migrated ${expensesArray.length} expenses.`);
          }
          if (data.budgets && Object.keys(data.budgets).length > 0) {
            const budgetsArray = Object.values(data.budgets);
            await BudgetModel.insertMany(budgetsArray);
            console.log(`Migrated ${budgetsArray.length} budgets.`);
          }
          console.log("Migration complete.");

          // Rename the file so we don't migrate again if we clear DB
          fs.renameSync(DATA_FILE, `${DATA_FILE}.migrated`);
        }
      }
    } catch (err) {
      console.error("Failed to migrate data.json to MongoDB:", err);
    }
  }

  async isDataEmpty(): Promise<boolean> {
    const userCount = await UserModel.countDocuments();
    return userCount === 0;
  }

  private mapUser(doc: IUserDocument): User {
    const obj = doc.toObject();
    delete obj._id;
    delete obj.__v;
    return obj as User;
  }

  private mapExpense(doc: IExpenseDocument): Expense {
    const obj = doc.toObject();
    delete obj._id;
    delete obj.__v;
    return obj as Expense;
  }

  private mapBudget(doc: IBudgetDocument): Budget {
    const obj = doc.toObject();
    delete obj._id;
    delete obj.__v;
    return obj as Budget;
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ id });
    return user ? this.mapUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? this.mapUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser & { currency?: string; currencySymbol?: string }, isAdmin = false): Promise<User> {
    const id = randomUUID();
    const newUser = await UserModel.create({
      ...insertUser,
      id,
      avatar: null,
      isAdmin,
      currency: insertUser.currency || "USD",
      currencySymbol: insertUser.currencySymbol || "$"
    });
    return this.mapUser(newUser);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const updatedUser = await UserModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    );
    return updatedUser ? this.mapUser(updatedUser) : undefined;
  }

  async getExpenses(userId: string): Promise<Expense[]> {
    const expenses = await ExpenseModel.find({ userId });
    return expenses
      .map(e => this.mapExpense(e))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const expense = await ExpenseModel.findOne({ id });
    return expense ? this.mapExpense(expense) : undefined;
  }

  async createExpense(userId: string, expense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const newExpense = await ExpenseModel.create({
      ...expense,
      id,
      userId,
      createdAt: new Date().toISOString(),
    });
    return this.mapExpense(newExpense);
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense | undefined> {
    const updatedExpense = await ExpenseModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    );
    return updatedExpense ? this.mapExpense(updatedExpense) : undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await ExpenseModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getBudget(userId: string, month: number, year: number): Promise<Budget | undefined> {
    const budget = await BudgetModel.findOne({ userId, month, year });
    return budget ? this.mapBudget(budget) : undefined;
  }

  async setBudget(userId: string, budget: InsertBudget): Promise<Budget> {
    const existing = await BudgetModel.findOne({ userId, month: budget.month, year: budget.year });
    if (existing) {
      existing.amount = budget.amount;
      if (budget.categories !== undefined) {
        existing.categories = budget.categories;
      }
      await existing.save();
      return this.mapBudget(existing);
    }
    const id = randomUUID();
    const newBudget = await BudgetModel.create({ ...budget, id, userId });
    return this.mapBudget(newBudget);
  }

  async getBudgets(userId: string): Promise<Budget[]> {
    const budgets = await BudgetModel.find({ userId });
    return budgets.map(b => this.mapBudget(b));
  }

  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.find({});
    return users.map(u => this.mapUser(u));
  }

  async getAllExpenses(): Promise<Expense[]> {
    const expenses = await ExpenseModel.find({});
    return expenses
      .map(e => this.mapExpense(e))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const storage = new MongoStorage();
