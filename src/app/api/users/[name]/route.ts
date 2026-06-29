import { NextResponse } from 'next/server'
import { getUserByName, updateUserPassword, updateUserUpi } from '@/lib/users'

export async function PATCH(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const body = await request.json();
    
    if (!body.password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    
    await updateUserPassword(name, body.password);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const body = await request.json();
    
    if (body.upiId !== undefined) {
      await updateUserUpi(name, body.upiId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
