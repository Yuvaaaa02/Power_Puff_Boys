import { NextResponse } from 'next/server'
import { getExpenses, addExpense } from '@/lib/dataUtils'


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') ?? undefined
    const expenses = await getExpenses(month)
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: "Failed to read expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const expense = await addExpense(body)
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
