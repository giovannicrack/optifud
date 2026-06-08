import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

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

  await supabase.from('meal_plans').delete().eq('date', date).eq('status', 'draft')

  const { data: profile } = await supabase.from('user_profile').select('*').single()
  if (!profile) return NextResponse.json({ error: 'Configure tu perfil primero' }, { status: 400 })

  const { data: stock } = await supabase.from('stock').select('*, food:foods_catalog(*)').gt('quantity_g', 50)
  if (!stock || stock.length === 0) return NextResponse.json({ error: 'Stock insuficiente para generar un plan' }, { status: 400 })

  let planMeals: GeneratedMeal[]

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      planMeals = await generatePlanWithClaude(stock, profile)
    } catch {
      planMeals = generatePlanAlgorithmic(stock, profile).meals
    }
  } else {
    planMeals = generatePlanAlgorithmic(stock, profile).meals
  }

  const { data: newPlan, error: planErr } = await supabase
    .from('meal_plans')
    .insert({ date, status: 'draft' })
    .select()
    .single()

  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })

  for (const meal of planMeals) {
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

  const { data: completePlan } = await supabase
    .from('meal_plans')
    .select(`*, meals(*, meal_items(*, food:foods_catalog(*)))`)
    .eq('id', newPlan.id)
    .single()

  return NextResponse.json(completePlan)
}

interface GeneratedMeal {
  type: string
  name: string
  items: { food_id: string; quantity_g: number }[]
}

type StockItem = {
  food_id: string
  quantity_g: number
  food: {
    id: string
    name: string
    category: string
    protein_per_100g: number
    carbs_per_100g: number
    fat_per_100g: number
    calories_per_100g: number
    fiber_per_100g: number
  }
}

type Profile = {
  weight_kg: number
  height_cm: number
  age: number
  goal: string
  activity_level: string
  target_calories: number
  target_protein_g: number
  target_carbs_g: number
  target_fat_g: number
}

async function generatePlanWithClaude(stock: StockItem[], profile: Profile): Promise<GeneratedMeal[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const stockList = stock.map(s =>
    `- ${s.food.name} (${s.food.category}): ${Math.round(s.quantity_g)}g disponibles | ${s.food.calories_per_100g}kcal, ${s.food.protein_per_100g}g prot, ${s.food.carbs_per_100g}g carbs, ${s.food.fat_per_100g}g grasas por 100g`
  ).join('\n')

  const goalLabel = { cut: 'bajar peso (déficit calórico)', maintain: 'mantener peso', bulk: 'ganar masa muscular (superávit calórico)' }[profile.goal] || profile.goal
  const activityLabel = { sedentary: 'sedentario', light: 'actividad ligera', moderate: 'actividad moderada', active: 'muy activo', very_active: 'atleta/doble sesión' }[profile.activity_level] || profile.activity_level

  const prompt = `Sos un preparador físico y nutricionista especializado. Tu objetivo es crear un plan de alimentación diario óptimo para el usuario basándote EXCLUSIVAMENTE en los alimentos disponibles en su stock.

PERFIL DEL USUARIO:
- Objetivo: ${goalLabel}
- Nivel de actividad: ${activityLabel}
- Metas diarias: ${profile.target_calories} kcal | ${profile.target_protein_g}g proteína | ${profile.target_carbs_g}g carbohidratos | ${profile.target_fat_g}g grasas

STOCK DISPONIBLE:
${stockList}

INSTRUCCIONES:
1. Creá 4 comidas: Desayuno, Almuerzo, Merienda, Cena
2. Usá SOLO los alimentos del stock listado arriba (respetá la disponibilidad)
3. Asegurate que los macros totales estén dentro del ±10% de los objetivos
4. Priorizá proteína en las comidas principales
5. Respondé ÚNICAMENTE con JSON válido, sin texto adicional

FORMATO DE RESPUESTA (JSON):
{
  "meals": [
    {
      "type": "breakfast",
      "name": "Nombre descriptivo del desayuno",
      "items": [
        { "food_name": "nombre exacto del alimento del stock", "quantity_g": 150 }
      ]
    },
    {
      "type": "lunch",
      "name": "Nombre descriptivo del almuerzo",
      "items": [...]
    },
    {
      "type": "snack",
      "name": "Nombre descriptivo de la merienda",
      "items": [...]
    },
    {
      "type": "dinner",
      "name": "Nombre descriptivo de la cena",
      "items": [...]
    }
  ]
}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')

  const parsed = JSON.parse(jsonMatch[0])
  const aiMeals = parsed.meals as Array<{ type: string; name: string; items: Array<{ food_name: string; quantity_g: number }> }>

  // Map food names back to food_ids from stock
  const foodByName = new Map(stock.map(s => [s.food.name.toLowerCase(), s.food.id]))

  return aiMeals.map(meal => ({
    type: meal.type,
    name: meal.name,
    items: meal.items
      .map(item => {
        const foodId = foodByName.get(item.food_name.toLowerCase()) ||
          [...foodByName.entries()].find(([name]) => name.includes(item.food_name.toLowerCase().split(' ')[0]))?.[1]
        return foodId ? { food_id: foodId, quantity_g: item.quantity_g } : null
      })
      .filter((i): i is { food_id: string; quantity_g: number } => i !== null),
  })).filter(m => m.items.length > 0)
}

function generatePlanAlgorithmic(
  stock: StockItem[],
  profile: Profile
) {
  const proteins = stock.filter(s => ['proteina', 'lacteo'].includes(s.food.category))
  const carbs = stock.filter(s => ['carbohidrato', 'legumbre'].includes(s.food.category))
  const veggies = stock.filter(s => ['verdura', 'fruta'].includes(s.food.category))
  const fats = stock.filter(s => ['grasa', 'fruto seco'].includes(s.food.category))
  const fruits = stock.filter(s => s.food.category === 'fruta')

  const pick = (arr: typeof stock) => arr[Math.floor(Math.random() * arr.length)]

  void profile

  const meals: GeneratedMeal[] = [
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
        ...(fruits.length ? [{ food_id: pick(fruits).food.id, quantity_g: 150 }] : []),
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
