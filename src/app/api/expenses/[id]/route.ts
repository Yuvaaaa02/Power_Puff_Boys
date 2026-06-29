import { NextResponse } from "next/server";
import { readExpenses, writeExpenses } from "@/lib/dataUtils";
import { Expense } from "@/lib/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const expenses = await readExpenses();
    const index = expenses.findIndex(e => e.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    
    expenses[index] = { ...expenses[index], ...body, id };
    await writeExpenses(expenses);
    
    return NextResponse.json(expenses[index]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const expenses = await readExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    
    if (filtered.length === expenses.length) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    
    await writeExpenses(filtered);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
