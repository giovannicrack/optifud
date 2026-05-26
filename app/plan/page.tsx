'use client'

import { useEffect, useState } from 'react'
import { UtensilsCrossed, RefreshCw, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import MacroBar from '@/components/MacroBar'

interface FoodInfo {
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}

interface MealItem {
  id: string
  quantity_g: number
  food: FoodInfo
}

interface Meal {
  id: string
  meal_type: string
  name: string
  accepted: boolean
  meal_items: MealItem[]
}

interface Plan {
  id: string
  date: string
  status: string
  meals: Meal[]
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '🍽️',
  snack: '🍎',
  dinner: '🌙',
}

function calcMealMacros(items: MealItem[]) {
  return items.reduce(
    (acc, i) => {
      const f = i.quantity_g / 100
      return {
        calories: acc.calories + i.food.calories_per_100g * f,
        protein: acc.protein + i.food.protein_per_100g * f,
        carbs: acc.carbs + i.food.carbs_per_100g * f,
        fat: acc.fat + i.food.fat_per_100g * f,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export default function PlanPage() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ target_calories: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number } | null>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadPlan()
    fetch('/api/profile').then(r => r.json()).then(d => { if (d) setProfile(d) })
  }, [])

  async function loadPlan() {
    setLoading(true)
    const res = await fetch(`/api/plan?date=${today}`)
    if (res.ok) {
      const data = await res.json()
      setPlan(data)
      if (data?.meals?.length) setExpanded(data.meals[0].id)
    }
    setLoading(false)
  }

  async function generatePlan() {
    setGenerating(true)
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today }),
    })
    if (res.ok) {
      const data = await res.json()
      setPlan(data)
      if (data?.meals?.length) setExpanded(data.meals[0].id)
    } else {
      const err = await res.json()
      alert(err.error || 'Error al generar el plan')
    }
    setGenerating(false)
  }

  async function acceptMeal(mealId: string) {
    setAccepting(mealId)
    const res = await fetch('/api/plan/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: mealId }),
    })
    if (res.ok) {
      setPlan(p => p ? {
        ...p,
        meals: p.meals.map(m => m.id === mealId ? { ...m, accepted: true } : m)
      } : null)
    }
    setAccepting(null)
  }

  async function acceptAll() {
    if (!plan) return
    setAccepting('all')
    const res = await fetch('/api/plan/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: plan.id, accept_all: true }),
    })
    if (res.ok) {
      setPlan(p => p ? {
        ...p,
        status: 'accepted',
        meals: p.meals.map(m => ({ ...m, accepted: true }))
      } : null)
    }
    setAccepting(null)
  }

  const allMacros = plan?.meals?.flatMap(m => m.meal_items) ?? []
  const totalMacros = calcMealMacros(allMacros)
  const acceptedItems = plan?.meals?.filter(m => m.accepted).flatMap(m => m.meal_items) ?? []
  const consumedMacros = calcMealMacros(acceptedItems)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <UtensilsCrossed size={20} className="text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-800">Plan de hoy</h1>
            <p className="text-zinc-400 text-sm">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <button
          onClick={generatePlan}
          disabled={generating}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {plan ? 'Regenerar' : 'Generar plan'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 py-16">
          <Loader2 size={32} className="mx-auto animate-spin mb-2 opacity-40" />
          Cargando plan...
        </div>
      ) : !plan ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 text-center space-y-4">
          <UtensilsCrossed size={48} className="mx-auto text-zinc-200" />
          <div>
            <p className="font-medium text-zinc-700">No hay plan para hoy</p>
            <p className="text-sm text-zinc-400 mt-1">Asegurate de tener stock y perfil configurado</p>
          </div>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-2xl transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : null}
            Generar plan del día
          </button>
        </div>
      ) : (
        <>
          {profile && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Macros del plan</h2>
                <span className="text-xs text-zinc-400">{plan.meals.filter(m => m.accepted).length}/{plan.meals.length} comidas aceptadas</span>
              </div>
              <MacroBar label="Calorías" current={consumedMacros.calories} target={profile.target_calories} unit=" kcal" color="bg-emerald-400" />
              <MacroBar label="Proteína" current={consumedMacros.protein} target={profile.target_protein_g} color="bg-blue-400" />
              <MacroBar label="Carbohidratos" current={consumedMacros.carbs} target={profile.target_carbs_g} color="bg-amber-400" />
              <MacroBar label="Grasas" current={consumedMacros.fat} target={profile.target_fat_g} color="bg-rose-400" />
            </div>
          )}

          {plan.status !== 'accepted' && (
            <button
              onClick={acceptAll}
              disabled={accepting === 'all'}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-50"
            >
              {accepting === 'all' ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Aceptar todo el plan y descontar stock
            </button>
          )}

          <div className="space-y-3">
            {plan.meals.map(meal => {
              const macros = calcMealMacros(meal.meal_items)
              const isOpen = expanded === meal.id
              return (
                <div
                  key={meal.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                    meal.accepted ? 'border-emerald-200' : 'border-zinc-100'
                  }`}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : meal.id)}
                    className="w-full px-4 py-4 flex items-center gap-3 text-left"
                  >
                    <span className="text-2xl">{MEAL_ICONS[meal.meal_type] ?? '🍴'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-800">{meal.name}</span>
                        {meal.accepted && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            Aceptado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {Math.round(macros.calories)} kcal · {Math.round(macros.protein)}g P · {Math.round(macros.carbs)}g C · {Math.round(macros.fat)}g G
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-zinc-50">
                      <div className="space-y-2 pt-3">
                        {meal.meal_items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-zinc-700">{item.food.name}</span>
                            <div className="flex items-center gap-3 text-zinc-400">
                              <span>{Math.round(item.quantity_g)}g</span>
                              <span>{Math.round((item.quantity_g / 100) * item.food.calories_per_100g)} kcal</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!meal.accepted && (
                        <button
                          onClick={() => acceptMeal(meal.id)}
                          disabled={accepting === meal.id}
                          className="w-full flex items-center justify-center gap-1.5 border border-emerald-300 text-emerald-700 font-medium text-sm py-2 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                          {accepting === meal.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Aceptar esta comida
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4 text-sm text-zinc-500 space-y-1">
            <p className="font-medium text-zinc-600">Total del plan</p>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                { label: 'Calorías', val: totalMacros.calories, unit: 'kcal' },
                { label: 'Proteína', val: totalMacros.protein, unit: 'g' },
                { label: 'Carbos', val: totalMacros.carbs, unit: 'g' },
                { label: 'Grasas', val: totalMacros.fat, unit: 'g' },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <div className="text-base font-bold text-zinc-800">{Math.round(m.val)}</div>
                  <div className="text-xs text-zinc-400">{m.unit}</div>
                  <div className="text-xs text-zinc-400">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
