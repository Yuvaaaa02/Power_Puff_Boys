import { NextResponse } from "next/server";
import { readUsers } from "@/lib/dataUtils";
import { UsersData } from "@/lib/types";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await readUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read users" }, { status: 500 });
  }
}
