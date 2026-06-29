import { NextResponse } from "next/server";
import { readUsers, writeUsers } from "@/lib/dataUtils";

export async function PATCH(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const body = await request.json();
    
    if (!body.password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    
    const users = await readUsers();
    
    if (!users[name]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    users[name].password = body.password;
    await writeUsers(users);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
