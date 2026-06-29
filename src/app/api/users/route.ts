import { NextResponse } from 'next/server'
import { readUsers } from '@/lib/users'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const users = await readUsers()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Failed to read users" }, { status: 500 });
  }
}
