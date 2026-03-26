import { pgTable, text, varchar, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  country: text("country").default("United States").notNull(),
  currency: text("currency").default("USD").notNull(),
  currencySymbol: text("currency_symbol").default("$").notNull(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  amount: real("amount").notNull(),
  categories: text("categories"), // JSON string
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, avatar: true, isAdmin: true, currency: true, currencySymbol: true }).extend({
  country: z.string().min(1, "Please select your country"),
});
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, userId: true, createdAt: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true, userId: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Health & Fitness",
  "Bills & Utilities",
  "Travel",
  "Education",
  "Other",
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
