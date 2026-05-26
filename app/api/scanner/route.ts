import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('image') as File | null

  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Analizá esta factura de supermercado. Extraé todos los productos alimenticios con su cantidad y peso si está disponible.
Respondé ÚNICAMENTE con un JSON válido en este formato:
{
  "items": [
    { "name": "nombre del producto", "quantity": 1, "weight_g": 500 }
  ]
}
Si no podés determinar el peso, usá 500 como valor por defecto para items secos y 1000 para líquidos.
Solo incluí alimentos, ignorá artículos de limpieza u otros no alimenticios.`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  let items: Array<{ name: string; quantity: number; weight_g: number }> = []
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      items = parsed.items || []
    }
  } catch {
    return NextResponse.json({ error: 'No se pudo parsear la respuesta de IA', raw: text }, { status: 422 })
  }

  // Match items to foods_catalog and add to stock
  const supabase = createServiceClient()
  const added: string[] = []

  for (const item of items) {
    const { data: foods } = await supabase
      .from('foods_catalog')
      .select('*')
      .ilike('name', `%${item.name.split(' ')[0]}%`)
      .limit(1)

    const food = foods?.[0]
    const totalGrams = (item.weight_g || 500) * (item.quantity || 1)

    if (food) {
      const { data: existing } = await supabase
        .from('stock')
        .select('id, quantity_g')
        .eq('food_id', food.id)
        .single()

      if (existing) {
        await supabase.from('stock').update({ quantity_g: existing.quantity_g + totalGrams, updated_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await supabase.from('stock').insert({ food_id: food.id, quantity_g: totalGrams })
      }
      added.push(`${food.name} (+${totalGrams}g)`)
    } else {
      // Create new food entry
      const { data: newFood } = await supabase
        .from('foods_catalog')
        .insert({ name: item.name, category: 'general', calories_per_100g: 100, protein_per_100g: 5, carbs_per_100g: 15, fat_per_100g: 3 })
        .select()
        .single()

      if (newFood) {
        await supabase.from('stock').insert({ food_id: newFood.id, quantity_g: totalGrams })
        added.push(`${item.name} (+${totalGrams}g) [nuevo]`)
      }
    }
  }

  await supabase.from('invoice_scans').insert({ raw_text: text, items_detected: items })

  return NextResponse.json({ ok: true, detected: items, added })
}
