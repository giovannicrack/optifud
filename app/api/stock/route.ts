import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('stock')
    .select('*, food:foods_catalog(*)')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  // upsert food first if new
  let food_id = body.food_id
  if (!food_id && body.food_name) {
    const { data: existing } = await supabase
      .from('foods_catalog')
      .select('id')
      .ilike('name', body.food_name)
      .single()

    if (existing) {
      food_id = existing.id
    } else {
      const { data: newFood, error: foodErr } = await supabase
        .from('foods_catalog')
        .insert({
          name: body.food_name,
          category: body.category || 'general',
          protein_per_100g: body.protein_per_100g || 0,
          carbs_per_100g: body.carbs_per_100g || 0,
          fat_per_100g: body.fat_per_100g || 0,
          calories_per_100g: body.calories_per_100g || 0,
          fiber_per_100g: body.fiber_per_100g || 0,
        })
        .select()
        .single()
      if (foodErr) return NextResponse.json({ error: foodErr.message }, { status: 500 })
      food_id = newFood.id
    }
  }

  // Check if stock entry exists for this food
  const { data: existing } = await supabase
    .from('stock')
    .select('id, quantity_g')
    .eq('food_id', food_id)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('stock')
      .update({ quantity_g: existing.quantity_g + (body.quantity_g || 100), updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*, food:foods_catalog(*)')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('stock')
    .insert({ food_id, quantity_g: body.quantity_g || 100, expiry_date: body.expiry_date || null })
    .select('*, food:foods_catalog(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('stock')
    .update({ quantity_g: body.quantity_g, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select('*, food:foods_catalog(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const { error } = await supabase.from('stock').delete().eq('id', id!)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
