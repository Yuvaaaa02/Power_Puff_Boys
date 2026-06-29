export type Role = "admin" | "member";

export interface User {
  password?: string; // We will omit this when sending to the client ideally, but for JSON it's there
  role: Role;
  approved?: boolean;
  upiId?: string;
}

export interface ExpenseItem {
  name: string;
  cost: number;
}

export type Section = "morning" | "afternoon" | "night";

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  section: Section;
  paidBy: string;
  items?: ExpenseItem[]; // Only for morning
  totalAmount: number;
  splitAmong: string[];
  splitAmount: number;
  description?: string; // Only for afternoon/night
}

export type UsersData = Record<string, User>;
export type ExpensesData = Expense[];

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  status: "paid" | "pending";
  note: string;
  expenseId?: string;
}

export type SettlementsData = Settlement[];
