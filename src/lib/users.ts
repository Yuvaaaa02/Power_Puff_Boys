import { supabase } from './supabase'
import { User, UsersData, Role } from './types'

function rowToUser(row: any) {
  return {
    name: row.name,
    password: row.password,
    role: row.role as Role,
    approved: row.approved,
    upiId: row.upi_id || undefined,
  }
}

export async function getUsers(): Promise<any[]> {
  const { data, error } = await supabase.from('users').select('*')
  if (error) throw error
  return (data || []).map(rowToUser)
}

export async function getUserByName(name: string): Promise<any | null> {
  const { data, error } = await supabase.from('users').select('*').eq('name', name).maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToUser(data)
}

export async function readUsers(): Promise<UsersData> {
  const users = await getUsers()
  const usersMap: UsersData = {}
  users.forEach(u => {
    usersMap[u.name] = {
      password: u.password,
      role: u.role,
      approved: u.approved,
      upiId: u.upiId
    }
  })
  return usersMap
}

export async function updateUserUpi(name: string, upiId: string): Promise<void> {
  const { error } = await supabase.from('users').update({ upi_id: upiId }).eq('name', name)
  if (error) throw error
}

export async function updateUserPassword(name: string, password: string): Promise<void> {
  const { error } = await supabase.from('users').update({ password }).eq('name', name)
  if (error) throw error
}

export async function approveUser(name: string): Promise<void> {
  const { error } = await supabase.from('users').update({ approved: true }).eq('name', name)
  if (error) throw error
}
