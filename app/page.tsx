'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MacroBar from '@/components/MacroBar'
import MacroRing from '@/components/MacroRing'
import { Package, UtensilsCrossed, ShoppingCart, ChevronRight, Zap } from 'lucide-react'

interface Profile {
  name: string
  target_calories: number
  target_protein_g: number
  target_carbs_g: number
  target_fat_g: number
}

interface FoodInfo {
  name: string
  category: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}

interface MealItem {
  quantity_g: number
  food: FoodInfo
}

interface Meal {
  accepted: boolean
  meal_items: MealItem[]
}

interface TodayPlan {
  meals: Meal[]
}

interface StockItem {
  id: string
  quantity_g: number
  food: FoodInfo
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stock, setStock] = useState<StockItem[]>([])
  const [today, setToday] = useState<TodayPlan | null>(null)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [pRes, sRes] = await Promise.all([fetch('/api/profile'), fetch('/api/stock')])
    if (pRes.ok) { const d = await pRes.json(); if (d) setProfile(d) }
    if (sRes.ok) setStock(await sRes.json())
    const date = new Date().toISOString().split('T')[0]
    const planRes = await fetch(`/api/plan?date=${date}`)
    if (planRes.ok) { const d = await planRes.json(); if (d) setToday(d) }
  }

  async function handleSeed() {
    setSeeding(true)
    await fetch('/api/foods/seed', { method: 'POST' })
    setSeeding(false)
    alert('Base de alimentos cargada exitosamente.')
  }

  const acceptedMeals = today?.meals?.filter(m => m.accepted) ?? []
  const consumed = acceptedMeals.reduce(
    (acc, m) => {
      const t = m.meal_items.reduce(
        (a, i) => ({
          calories: a.calories + (i.quantity_g / 100) * i.food.calories_per_100g,
          protein: a.protein + (i.quantity_g / 100) * i.food.protein_per_100g,
          carbs: a.carbs + (i.quantity_g / 100) * i.food.carbs_per_100g,
          fat: a.fat + (i.quantity_g / 100) * i.food.fat_per_100g,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
      return { calories: acc.calories + t.calories, protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs, fat: acc.fat + t.fat }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const lowStock = stock.filter(s => s.quantity_g < 200)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Hola, {profile?.name ?? 'bienvenido'}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {seeding ? 'Cargando...' : 'Cargar alimentos'}
        </button>
      </div>

      {profile ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-widest">Macros de hoy</h2>
          <div className="flex items-center gap-6">
            <MacroRing calories={consumed.calories} target={profile.target_calories} size={130} />
            <div className="flex-1 space-y-3">
              <MacroBar label="Proteína" current={consumed.protein} target={profile.target_protein_g} color="bg-blue-400" />
              <MacroBar label="Carbohidratos" current={consumed.carbs} target={profile.target_carbs_g} color="bg-amber-400" />
              <MacroBar label="Grasas" current={consumed.fat} target={profile.target_fat_g} color="bg-rose-400" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <p className="text-emerald-800 font-medium text-sm">Completá tu perfil para calcular tus macros</p>
          <Link href="/perfil" className="text-emerald-600 text-sm underline mt-1 inline-block">Ir al perfil →</Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/stock', icon: Package, label: 'Mi Stock', value: `${stock.length} items`, color: 'text-violet-500 bg-violet-50' },
          { href: '/plan', icon: UtensilsCrossed, label: 'Plan hoy', value: today ? `${today.meals?.length ?? 0} comidas` : 'Sin plan', color: 'text-emerald-500 bg-emerald-50' },
          { href: '/compras', icon: ShoppingCart, label: 'Por comprar', value: `${lowStock.length} bajo`, color: 'text-amber-500 bg-amber-50' },
        ].map(({ href, icon: Icon, label, value, color }) => (
          <Link key={href} href={href} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 hover:shadow-md transition-all">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-xs text-zinc-400">{label}</div>
            <div className="text-sm font-semibold text-zinc-800 mt-0.5">{value}</div>
          </Link>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Stock bajo</span>
          </div>
          <div className="space-y-1.5">
            {lowStock.slice(0, 5).map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-amber-700">{s.food.name}</span>
                <span className="text-amber-500 font-medium">{Math.round(s.quantity_g)}g</span>
              </div>
            ))}
          </div>
          <Link href="/compras" className="flex items-center gap-1 text-amber-600 text-sm mt-3 font-medium">
            Ver sugerencias <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}
