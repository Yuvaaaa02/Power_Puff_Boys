import { NextResponse } from "next/server";
import { readSettlements, writeSettlements } from "@/lib/settlements";
import { Settlement } from "@/lib/types";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // e.g., "2025-06"
    
    let settlements = await readSettlements();
    
    if (month) {
      settlements = settlements.filter(s => s.month === month);
    }
    
    // Return newest first
    settlements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json(settlements);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read settlements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const today = new Date();
    
    const newSettlement: Settlement = {
      id: crypto.randomUUID(),
      from: body.from,
      to: body.to,
      amount: body.amount,
      date: format(today, "yyyy-MM-dd"),
      month: format(today, "yyyy-MM"),
      status: "paid", // per requirements
      note: body.note || "",
      expenseId: body.expenseId
    };
    
    const settlements = await readSettlements();
    settlements.push(newSettlement);
    await writeSettlements(settlements);
    
    return NextResponse.json(newSettlement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create settlement" }, { status: 500 });
  }
}
