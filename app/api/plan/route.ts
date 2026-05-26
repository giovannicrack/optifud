import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const { data: plan, error } = await supabase
    .from('meal_plans')
    .select(`*, meals(*, meal_items(*, food:foods_catalog(*)))`)
    .eq('date', date)
    .single()

  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(plan || null)
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()
  const date = body.date || new Date().toISOString().split('T')[0]

  // Delete existing draft for today
  await supabase.from('meal_plans').delete().eq('date', date).eq('status', 'draft')

  // Get profile macros
  const { data: profile } = await supabase.from('user_profile').select('*').single()
  if (!profile) return NextResponse.json({ error: 'Configure tu perfil primero' }, { status: 400 })

  // Get available stock
  const { data: stock } = await supabase.from('stock').select('*, food:foods_catalog(*)').gt('quantity_g', 50)
  if (!stock || stock.length === 0) return NextResponse.json({ error: 'Stock insuficiente para generar un plan' }, { status: 400 })

  // Simple greedy meal plan generator
  const plan = generatePlan(stock, profile)

  const { data: newPlan, error: planErr } = await supabase
    .from('meal_plans')
    .insert({ date, status: 'draft' })
    .select()
    .single()

  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })

  for (const meal of plan.meals) {
    const { data: newMeal, error: mealErr } = await supabase
      .from('meals')
      .insert({ plan_id: newPlan.id, meal_type: meal.type, name: meal.name })
      .select()
      .single()

    if (mealErr || !newMeal) continue

    for (const item of meal.items) {
      await supabase.from('meal_items').insert({
        meal_id: newMeal.id,
        food_id: item.food_id,
        quantity_g: item.quantity_g,
      })
    }
  }

  // Fetch complete plan
  const { data: completePlan } = await supabase
    .from('meal_plans')
    .select(`*, meals(*, meal_items(*, food:foods_catalog(*)))`)
    .eq('id', newPlan.id)
    .single()

  return NextResponse.json(completePlan)
}

function generatePlan(
  stock: Array<{ food_id: string; quantity_g: number; food: { id: string; name: string; category: string; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number; calories_per_100g: number } }>,
  profile: { target_calories: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number }
) {
  const proteins = stock.filter(s => ['proteina', 'lacteo'].includes(s.food.category))
  const carbs = stock.filter(s => ['carbohidrato', 'legumbre'].includes(s.food.category))
  const veggies = stock.filter(s => ['verdura', 'fruta'].includes(s.food.category))
  const fats = stock.filter(s => ['grasa', 'fruto seco'].includes(s.food.category))

  const pick = (arr: typeof stock) => arr[Math.floor(Math.random() * arr.length)]

  const meals = [
    {
      type: 'breakfast',
      name: 'Desayuno',
      items: [
        ...(carbs.length ? [{ food_id: pick(carbs).food.id, quantity_g: 60 }] : []),
        ...(proteins.length ? [{ food_id: pick(proteins).food.id, quantity_g: 120 }] : []),
      ],
    },
    {
      type: 'lunch',
      name: 'Almuerzo',
      items: [
        ...(proteins.length ? [{ food_id: pick(proteins).food.id, quantity_g: 200 }] : []),
        ...(carbs.length ? [{ food_id: pick(carbs).food.id, quantity_g: 150 }] : []),
        ...(veggies.length ? [{ food_id: pick(veggies).food.id, quantity_g: 100 }] : []),
      ],
    },
    {
      type: 'snack',
      name: 'Merienda',
      items: [
        ...(fats.length ? [{ food_id: pick(fats).food.id, quantity_g: 30 }] : []),
        ...(fruits(stock).length ? [{ food_id: pick(fruits(stock)).food.id, quantity_g: 150 }] : []),
      ],
    },
    {
      type: 'dinner',
      name: 'Cena',
      items: [
        ...(proteins.length ? [{ food_id: pick(proteins).food.id, quantity_g: 180 }] : []),
        ...(veggies.length ? [{ food_id: pick(veggies).food.id, quantity_g: 150 }] : []),
        ...(carbs.length ? [{ food_id: pick(carbs).food.id, quantity_g: 100 }] : []),
      ],
    },
  ]

  return { meals }
}

function fruits(stock: Array<{ food_id: string; quantity_g: number; food: { id: string; name: string; category: string; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number; calories_per_100g: number } }>) {
  return stock.filter(s => s.food.category === 'fruta')
}
