import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function calcTargets(weight: number, height: number, age: number, goal: string, activity: string) {
  const activityFactors: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  }
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5
  const tdee = bmr * (activityFactors[activity] || 1.55)
  const calAdjust = goal === 'cut' ? -400 : goal === 'bulk' ? 300 : 0
  const calories = Math.round(tdee + calAdjust)
  const protein = Math.round(weight * 2)
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)
  return { target_calories: calories, target_protein_g: protein, target_carbs_g: carbs, target_fat_g: fat }
}

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('user_profile').select('*').limit(1).single()
  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || null)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  const targets = calcTargets(body.weight_kg, body.height_cm, body.age, body.goal, body.activity_level)

  const { data: existing } = await supabase.from('user_profile').select('id').limit(1).single()

  if (existing) {
    const { data, error } = await supabase
      .from('user_profile')
      .update({ ...body, ...targets, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('user_profile')
    .insert({ ...body, ...targets })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
