import { supabase } from './supabase'
import { Expense, Section, ExpenseItem } from './types'

// Map Supabase DB row to App Expense type
function rowToExpense(row: any): Expense {
  const section = row.category as Section;
  let items: ExpenseItem[] | undefined = undefined;
  let description: string | undefined = undefined;
  
  if (section === 'morning') {
    try {
      items = JSON.parse(row.description);
    } catch {
      items = [];
    }
  } else {
    description = row.description;
  }
  
  return {
    id: row.id,
    date: row.date,
    section,
    paidBy: row.paid_by,
    items,
    totalAmount: Number(row.amount),
    splitAmong: row.split_among,
    splitAmount: Number(row.amount) / row.split_among.length,
    description
  };
}

export async function getExpenses(month?: string): Promise<Expense[]> {
  let query = supabase.from('expenses').select('*').order('date', { ascending: false })
  if (month) query = query.eq('month', month)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(rowToExpense)
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const descriptionValue = expense.section === 'morning' && expense.items 
    ? JSON.stringify(expense.items) 
    : expense.description || '';

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      description: descriptionValue,
      amount: expense.totalAmount,
      paid_by: expense.paidBy,
      split_among: expense.splitAmong,
      category: expense.section,
      date: expense.date,
      month: expense.date.substring(0, 7)
    })
    .select()
    .single()
  if (error) throw error
  return rowToExpense(data)
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
  const dbUpdates: any = {}
  
  if (updates.section !== undefined) {
    dbUpdates.category = updates.section;
  }
  
  if (updates.items !== undefined && (updates.section === 'morning' || updates.section === undefined)) {
    dbUpdates.description = JSON.stringify(updates.items);
  } else if (updates.description !== undefined) {
    dbUpdates.description = updates.description;
  }
  
  if (updates.totalAmount !== undefined) dbUpdates.amount = updates.totalAmount;
  if (updates.paidBy !== undefined) dbUpdates.paid_by = updates.paidBy;
  if (updates.splitAmong !== undefined) dbUpdates.split_among = updates.splitAmong;
  if (updates.date !== undefined) {
    dbUpdates.date = updates.date;
    dbUpdates.month = updates.date.substring(0, 7);
  }

  const { error } = await supabase.from('expenses').update(dbUpdates).eq('id', id)
  if (error) throw error
}
