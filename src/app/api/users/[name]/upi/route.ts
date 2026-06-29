import { NextResponse } from 'next/server'
import { getUserByName, updateUserUpi } from '@/lib/users'

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const user = await getUserByName(name)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ upiId: user.upiId || null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read user upi" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const body = await request.json();
    await updateUserUpi(name, body.upiId || '');
    return NextResponse.json({ success: true, upiId: body.upiId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update upiId" }, { status: 500 });
  }
}
