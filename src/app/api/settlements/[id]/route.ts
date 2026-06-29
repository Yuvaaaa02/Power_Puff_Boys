import { NextResponse } from "next/server";
import { readSettlements, writeSettlements } from "@/lib/settlements";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const settlements = await readSettlements();
    const filtered = settlements.filter(s => s.id !== id);
    
    if (filtered.length === settlements.length) {
      return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
    }
    
    await writeSettlements(filtered);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete settlement" }, { status: 500 });
  }
}
