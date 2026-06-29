import { NextResponse } from "next/server";
import { readUsers, writeUsers } from "@/lib/dataUtils";

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const users = await readUsers();
    
    if (!users[name]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ upiId: users[name].upiId || null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read user upi" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const body = await request.json();
    
    const users = await readUsers();
    
    if (!users[name]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    users[name].upiId = body.upiId;
    await writeUsers(users);
    
    return NextResponse.json({ success: true, upiId: body.upiId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update upiId" }, { status: 500 });
  }
}
