import { NextResponse } from "next/server";
import { readExpenses, writeExpenses } from "@/lib/dataUtils";
import { Expense } from "@/lib/types";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // e.g., "2025-06"
    
    let expenses = await readExpenses();
    
    if (month) {
      expenses = expenses.filter(exp => exp.date.startsWith(month));
    }
    
    // Return newest first by sorting dates descending
    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json(expenses, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newExpense: Expense = {
      ...body,
      id: crypto.randomUUID(),
    };
    
    const expenses = await readExpenses();
    expenses.push(newExpense);
    await writeExpenses(expenses);
    
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
