import { NextResponse } from 'next/server'
import { getSettlements, addSettlement } from '@/lib/settlements'


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') ?? undefined
    const settlements = await getSettlements(month)
    return NextResponse.json(settlements)
  } catch (error) {
    return NextResponse.json({ error: "Failed to read settlements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const settlement = await addSettlement(body)
    return NextResponse.json(settlement, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create settlement" }, { status: 500 });
  }
}
