import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const LOW_STOCK_THRESHOLD = 200 // grams

const ESSENTIAL_CATEGORIES = ['proteina', 'carbohidrato', 'verdura', 'fruta']

export async function GET() {
  const supabase = createServiceClient()

  const { data: stock } = await supabase
    .from('stock')
    .select('*, food:foods_catalog(*)')
    .order('quantity_g', { ascending: true })

  const { data: profile } = await supabase.from('user_profile').select('*').single()
  const { data: allFoods } = await supabase
    .from('foods_catalog')
    .select('*')
    .in('category', ESSENTIAL_CATEGORIES)

  const suggestions: Array<{
    food_name: string
    category: string
    suggested_quantity_g: number
    reason: string
    priority: 'alta' | 'media' | 'baja'
  }> = []

  // Low stock alerts
  if (stock) {
    for (const item of stock) {
      if (item.quantity_g < LOW_STOCK_THRESHOLD) {
        suggestions.push({
          food_name: item.food.name,
          category: item.food.category,
          suggested_quantity_g: 1000,
          reason: `Stock bajo: solo ${Math.round(item.quantity_g)}g disponibles`,
          priority: item.quantity_g < 50 ? 'alta' : 'media',
        })
      }
    }
  }

  // Missing essential categories
  if (allFoods && stock) {
    const stockCats = new Set(stock.filter(s => s.quantity_g > LOW_STOCK_THRESHOLD).map(s => s.food.category))
    for (const cat of ESSENTIAL_CATEGORIES) {
      if (!stockCats.has(cat)) {
        const example = allFoods.find(f => f.category === cat)
        if (example) {
          suggestions.push({
            food_name: example.name,
            category: cat,
            suggested_quantity_g: 500,
            reason: `No tenés alimentos de la categoría "${cat}" en stock`,
            priority: 'alta',
          })
        }
      }
    }
  }

  // Protein deficit check
  if (profile && stock) {
    const proteinStock = stock
      .filter(s => s.food.category === 'proteina' && s.quantity_g > 0)
      .reduce((acc, s) => acc + (s.quantity_g * s.food.protein_per_100g) / 100, 0)

    const daysProtein = proteinStock / (profile.target_protein_g || 150)
    if (daysProtein < 3) {
      suggestions.push({
        food_name: 'Pollo pechuga',
        category: 'proteina',
        suggested_quantity_g: 1500,
        reason: `Stock de proteína para ${Math.round(daysProtein)} días (recomendado: 7+)`,
        priority: 'alta',
      })
    }
  }

  // Sort by priority
  const order: Record<string, number> = { alta: 0, media: 1, baja: 2 }
  suggestions.sort((a, b) => order[a.priority] - order[b.priority])

  return NextResponse.json({ suggestions: suggestions.slice(0, 15) })
}
