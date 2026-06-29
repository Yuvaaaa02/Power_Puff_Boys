import { NextResponse } from 'next/server'
import { deleteSettlement } from '@/lib/settlements'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteSettlement(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete settlement" }, { status: 500 });
  }
}
