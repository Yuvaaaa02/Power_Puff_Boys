import { NextResponse } from "next/server";
import { readUsers } from "@/lib/dataUtils";

export async function GET() {
  try {
    const users = await readUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read users" }, { status: 500 });
  }
}
