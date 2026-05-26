import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

type SupabaseClient = ReturnType<typeof createServiceClient>

async function checkTables(supabase: SupabaseClient) {
  const tableNames = ['foods_catalog', 'stock', 'user_profile', 'meal_plans', 'meals', 'meal_items']
  const results: Record<string, boolean> = {}
  for (const table of tableNames) {
    const { error } = await supabase.from(table).select('id').limit(1)
    results[table] = !error
  }
  return results
}

export async function GET() {
  const supabase = createServiceClient()
  const tables = await checkTables(supabase)
  return NextResponse.json({ tables })
}

export async function POST() {
  const supabase = createServiceClient()
  const tables = await checkTables(supabase)
  return NextResponse.json({ ok: true, tables })
}
