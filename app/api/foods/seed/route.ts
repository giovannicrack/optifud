import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const FOODS = [
  { name: 'Pollo pechuga', category: 'proteina', protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, calories_per_100g: 165, fiber_per_100g: 0 },
  { name: 'Carne vacuna molida', category: 'proteina', protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 15, calories_per_100g: 250, fiber_per_100g: 0 },
  { name: 'Atún en lata', category: 'proteina', protein_per_100g: 30, carbs_per_100g: 0, fat_per_100g: 1, calories_per_100g: 130, fiber_per_100g: 0 },
  { name: 'Salmón', category: 'proteina', protein_per_100g: 25, carbs_per_100g: 0, fat_per_100g: 13, calories_per_100g: 208, fiber_per_100g: 0 },
  { name: 'Huevo', category: 'proteina', protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, calories_per_100g: 155, fiber_per_100g: 0 },
  { name: 'Clara de huevo', category: 'proteina', protein_per_100g: 11, carbs_per_100g: 0.7, fat_per_100g: 0.2, calories_per_100g: 52, fiber_per_100g: 0 },
  { name: 'Pavo pechuga', category: 'proteina', protein_per_100g: 29, carbs_per_100g: 0, fat_per_100g: 1, calories_per_100g: 135, fiber_per_100g: 0 },
  { name: 'Queso cottage', category: 'proteina', protein_per_100g: 11, carbs_per_100g: 3.4, fat_per_100g: 4.3, calories_per_100g: 98, fiber_per_100g: 0 },
  { name: 'Yogur griego', category: 'lacteo', protein_per_100g: 10, carbs_per_100g: 4, fat_per_100g: 0.4, calories_per_100g: 59, fiber_per_100g: 0 },
  { name: 'Leche entera', category: 'lacteo', protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 3.6, calories_per_100g: 61, fiber_per_100g: 0 },
  { name: 'Leche descremada', category: 'lacteo', protein_per_100g: 3.4, carbs_per_100g: 5, fat_per_100g: 0.1, calories_per_100g: 34, fiber_per_100g: 0 },
  { name: 'Queso mozzarella', category: 'lacteo', protein_per_100g: 22, carbs_per_100g: 2.2, fat_per_100g: 17, calories_per_100g: 280, fiber_per_100g: 0 },
  { name: 'Arroz blanco', category: 'carbohidrato', protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, calories_per_100g: 130, fiber_per_100g: 0.4 },
  { name: 'Arroz integral', category: 'carbohidrato', protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, calories_per_100g: 111, fiber_per_100g: 1.8 },
  { name: 'Avena', category: 'carbohidrato', protein_per_100g: 17, carbs_per_100g: 66, fat_per_100g: 7, calories_per_100g: 389, fiber_per_100g: 11 },
  { name: 'Papa', category: 'carbohidrato', protein_per_100g: 2, carbs_per_100g: 17, fat_per_100g: 0.1, calories_per_100g: 77, fiber_per_100g: 2.2 },
  { name: 'Batata / camote', category: 'carbohidrato', protein_per_100g: 1.6, carbs_per_100g: 20, fat_per_100g: 0.1, calories_per_100g: 86, fiber_per_100g: 3 },
  { name: 'Pan integral', category: 'carbohidrato', protein_per_100g: 8, carbs_per_100g: 41, fat_per_100g: 3.4, calories_per_100g: 247, fiber_per_100g: 6 },
  { name: 'Pasta (cocida)', category: 'carbohidrato', protein_per_100g: 5, carbs_per_100g: 25, fat_per_100g: 0.9, calories_per_100g: 131, fiber_per_100g: 1.8 },
  { name: 'Quinoa', category: 'carbohidrato', protein_per_100g: 4.4, carbs_per_100g: 21, fat_per_100g: 1.9, calories_per_100g: 120, fiber_per_100g: 2.8 },
  { name: 'Lentejas cocidas', category: 'legumbre', protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0.4, calories_per_100g: 116, fiber_per_100g: 7.9 },
  { name: 'Garbanzos cocidos', category: 'legumbre', protein_per_100g: 8.9, carbs_per_100g: 27, fat_per_100g: 2.6, calories_per_100g: 164, fiber_per_100g: 7.6 },
  { name: 'Porotos negros', category: 'legumbre', protein_per_100g: 8.9, carbs_per_100g: 23, fat_per_100g: 0.5, calories_per_100g: 132, fiber_per_100g: 8.7 },
  { name: 'Palta / aguacate', category: 'grasa', protein_per_100g: 2, carbs_per_100g: 8.5, fat_per_100g: 15, calories_per_100g: 160, fiber_per_100g: 6.7 },
  { name: 'Aceite de oliva', category: 'grasa', protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, calories_per_100g: 884, fiber_per_100g: 0 },
  { name: 'Mantequilla de maní', category: 'grasa', protein_per_100g: 25, carbs_per_100g: 20, fat_per_100g: 50, calories_per_100g: 588, fiber_per_100g: 6 },
  { name: 'Almendras', category: 'fruto seco', protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 49, calories_per_100g: 579, fiber_per_100g: 12.5 },
  { name: 'Nueces', category: 'fruto seco', protein_per_100g: 15, carbs_per_100g: 14, fat_per_100g: 65, calories_per_100g: 654, fiber_per_100g: 6.7 },
  { name: 'Banana', category: 'fruta', protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, calories_per_100g: 89, fiber_per_100g: 2.6 },
  { name: 'Manzana', category: 'fruta', protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, calories_per_100g: 52, fiber_per_100g: 2.4 },
  { name: 'Naranja', category: 'fruta', protein_per_100g: 0.9, carbs_per_100g: 12, fat_per_100g: 0.1, calories_per_100g: 47, fiber_per_100g: 2.4 },
  { name: 'Frutillas / fresas', category: 'fruta', protein_per_100g: 0.7, carbs_per_100g: 8, fat_per_100g: 0.3, calories_per_100g: 32, fiber_per_100g: 2 },
  { name: 'Arándanos', category: 'fruta', protein_per_100g: 0.7, carbs_per_100g: 14, fat_per_100g: 0.3, calories_per_100g: 57, fiber_per_100g: 2.4 },
  { name: 'Espinaca', category: 'verdura', protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4, calories_per_100g: 23, fiber_per_100g: 2.2 },
  { name: 'Brócoli', category: 'verdura', protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4, calories_per_100g: 34, fiber_per_100g: 2.6 },
  { name: 'Tomate', category: 'verdura', protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2, calories_per_100g: 18, fiber_per_100g: 1.2 },
  { name: 'Zanahoria', category: 'verdura', protein_per_100g: 0.9, carbs_per_100g: 10, fat_per_100g: 0.2, calories_per_100g: 41, fiber_per_100g: 2.8 },
  { name: 'Pimiento rojo', category: 'verdura', protein_per_100g: 1, carbs_per_100g: 6, fat_per_100g: 0.3, calories_per_100g: 31, fiber_per_100g: 2.1 },
  { name: 'Pepino', category: 'verdura', protein_per_100g: 0.65, carbs_per_100g: 3.6, fat_per_100g: 0.1, calories_per_100g: 16, fiber_per_100g: 0.5 },
  { name: 'Lechuga', category: 'verdura', protein_per_100g: 1.4, carbs_per_100g: 2.9, fat_per_100g: 0.2, calories_per_100g: 15, fiber_per_100g: 1.3 },
  { name: 'Cebolla', category: 'verdura', protein_per_100g: 1.1, carbs_per_100g: 9.3, fat_per_100g: 0.1, calories_per_100g: 40, fiber_per_100g: 1.7 },
  { name: 'Ajo', category: 'condimento', protein_per_100g: 6.4, carbs_per_100g: 33, fat_per_100g: 0.5, calories_per_100g: 149, fiber_per_100g: 2.1 },
  { name: 'Proteína whey', category: 'suplemento', protein_per_100g: 80, carbs_per_100g: 6, fat_per_100g: 4, calories_per_100g: 380, fiber_per_100g: 0 },
]

export async function POST() {
  const supabase = createServiceClient()

  const { data: existing } = await supabase.from('foods_catalog').select('id').limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: true, message: 'Already seeded', count: 0 })
  }

  const { data, error } = await supabase.from('foods_catalog').insert(FOODS).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: data?.length })
}
