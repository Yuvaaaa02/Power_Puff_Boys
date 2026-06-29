import { supabase } from './supabase'
import { Settlement } from './types'

function rowToSettlement(row: any): Settlement {
  return {
    id: row.id,
    from: row.from,
    to: row.to,
    amount: Number(row.amount),
    date: row.date,
    month: row.month,
    status: row.status as 'paid' | 'pending',
    note: row.note || '',
    expenseId: row.expense_id || undefined,
  }
}

export async function getSettlements(month?: string): Promise<Settlement[]> {
  let query = supabase.from('settlements').select('*').order('date', { ascending: false })
  if (month) query = query.eq('month', month)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(rowToSettlement)
}

export async function addSettlement(
  settlement: Omit<Settlement, 'id' | 'date' | 'month'>
): Promise<Settlement> {
  const today = new Date()
  const date = today.toISOString().split('T')[0]
  const month = date.slice(0, 7)

  const { data, error } = await supabase
    .from('settlements')
    .insert({
      from: settlement.from,
      to: settlement.to,
      amount: settlement.amount,
      date,
      month,
      status: settlement.status || 'paid',
      note: settlement.note || '',
      expense_id: settlement.expenseId || null,
    })
    .select()
    .single()
  if (error) throw error
  return rowToSettlement(data)
}

export async function deleteSettlement(id: string): Promise<void> {
  const { error } = await supabase.from('settlements').delete().eq('id', id)
  if (error) throw error
}
