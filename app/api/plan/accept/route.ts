import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  // body: { meal_id?: string, plan_id?: string, accept_all?: boolean }

  if (body.plan_id && body.accept_all) {
    // Accept all meals — deduct entire plan from stock
    const { data: meals } = await supabase
      .from('meals')
      .select('*, meal_items(*, food:foods_catalog(*))')
      .eq('plan_id', body.plan_id)

    if (meals) {
      for (const meal of meals) {
        await acceptMealItems(supabase, meal.meal_items)
        await supabase.from('meals').update({ accepted: true }).eq('id', meal.id)
      }
    }
    await supabase.from('meal_plans').update({ status: 'accepted' }).eq('id', body.plan_id)
    return NextResponse.json({ ok: true })
  }

  if (body.meal_id) {
    const { data: meal } = await supabase
      .from('meals')
      .select('*, meal_items(*, food:foods_catalog(*))')
      .eq('id', body.meal_id)
      .single()

    if (!meal) return NextResponse.json({ error: 'Meal not found' }, { status: 404 })

    await acceptMealItems(supabase, meal.meal_items)
    await supabase.from('meals').update({ accepted: true }).eq('id', body.meal_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Provide meal_id or plan_id with accept_all' }, { status: 400 })
}

async function acceptMealItems(
  supabase: ReturnType<typeof createServiceClient>,
  items: Array<{ food_id: string; quantity_g: number }>
) {
  for (const item of items) {
    const { data: stockItem } = await supabase
      .from('stock')
      .select('id, quantity_g')
      .eq('food_id', item.food_id)
      .single()

    if (stockItem) {
      const newQty = Math.max(0, stockItem.quantity_g - item.quantity_g)
      await supabase.from('stock').update({ quantity_g: newQty, updated_at: new Date().toISOString() }).eq('id', stockItem.id)
    }
  }
}
