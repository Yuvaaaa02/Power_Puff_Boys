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
    console.log("[DELETE API] Trying to delete expense ID:", id);
    
    const expenses = await readExpenses();
    console.log("[DELETE API] Current expenses in DB:", expenses.length);
    
    const filtered = expenses.filter(e => e.id !== id);
    console.log("[DELETE API] Filtered expenses count:", filtered.length);
    
    if (filtered.length === expenses.length) {
      console.log("[DELETE API] Expense not found with ID:", id);
      return NextResponse.json({ error: "Expense not found", id }, { status: 404 });
    }
    
    await writeExpenses(filtered);
    console.log("[DELETE API] Successfully deleted expense ID:", id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE API] Error deleting expense:", error);
    return NextResponse.json({ 
      error: "Failed to delete expense", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
