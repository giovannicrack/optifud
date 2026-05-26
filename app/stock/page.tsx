'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, Trash2, Search, Pencil, Check, X } from 'lucide-react'

interface FoodInfo {
  id: string
  name: string
  category: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
}

interface StockItem {
  id: string
  quantity_g: number
  food: FoodInfo
}

const CATEGORY_COLORS: Record<string, string> = {
  proteina: 'bg-blue-50 text-blue-700',
  lacteo: 'bg-sky-50 text-sky-700',
  carbohidrato: 'bg-amber-50 text-amber-700',
  legumbre: 'bg-orange-50 text-orange-700',
  verdura: 'bg-emerald-50 text-emerald-700',
  fruta: 'bg-pink-50 text-pink-700',
  grasa: 'bg-yellow-50 text-yellow-700',
  'fruto seco': 'bg-stone-100 text-stone-600',
  condimento: 'bg-purple-50 text-purple-700',
  suplemento: 'bg-violet-50 text-violet-700',
  general: 'bg-zinc-100 text-zinc-600',
}

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [foodSearch, setFoodSearch] = useState('')
  const [foods, setFoods] = useState<FoodInfo[]>([])
  const [addQty, setAddQty] = useState('500')
  const [selectedFood, setSelectedFood] = useState<FoodInfo | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadStock() }, [])

  async function loadStock() {
    setLoading(true)
    const res = await fetch('/api/stock')
    if (res.ok) setStock(await res.json())
    setLoading(false)
  }

  async function searchFoods(q: string) {
    setFoodSearch(q)
    if (q.length < 2) { setFoods([]); return }
    const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}`)
    if (res.ok) setFoods(await res.json())
  }

  async function handleEdit(item: StockItem) {
    const res = await fetch('/api/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, quantity_g: parseFloat(editQty) }),
    })
    if (res.ok) {
      const updated = await res.json()
      setStock(s => s.map(i => i.id === item.id ? updated : i))
    }
    setEditId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este item del stock?')) return
    await fetch(`/api/stock?id=${id}`, { method: 'DELETE' })
    setStock(s => s.filter(i => i.id !== id))
  }

  async function handleAdd() {
    if (!selectedFood) return
    setAdding(true)
    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_id: selectedFood.id, quantity_g: parseFloat(addQty) }),
    })
    if (res.ok) {
      await loadStock()
      setShowAdd(false)
      setSelectedFood(null)
      setFoodSearch('')
      setFoods([])
      setAddQty('500')
    }
    setAdding(false)
  }

  const filtered = stock.filter(s =>
    s.food.name.toLowerCase().includes(search.toLowerCase()) ||
    s.food.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Package size={20} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-800">Mi Stock</h1>
            <p className="text-zinc-400 text-sm">{stock.length} alimentos registrados</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-4">
          <h3 className="font-semibold text-zinc-800">Agregar alimento al stock</h3>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={foodSearch}
              onChange={e => searchFoods(e.target.value)}
              placeholder="Buscar alimento..."
              className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          {foods.length > 0 && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100">
              {foods.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setSelectedFood(f); setFoods([]); setFoodSearch(f.name) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 transition-colors flex justify-between items-center"
                >
                  <span className="text-sm font-medium text-zinc-800">{f.name}</span>
                  <span className="text-xs text-zinc-400">{f.calories_per_100g} kcal/100g</span>
                </button>
              ))}
            </div>
          )}
          {selectedFood && (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block">Cantidad (gramos)</label>
                <input
                  type="number"
                  value={addQty}
                  onChange={e => setAddQty(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {adding ? 'Agregando...' : 'Confirmar'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filtrar stock..."
          className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 py-12">Cargando stock...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-zinc-400 py-12">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay items en tu stock.</p>
          <p className="text-sm mt-1">Agregá alimentos o usá el escáner de facturas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const isLow = item.quantity_g < 200
            const isEditing = editId === item.id
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl px-4 py-3.5 shadow-sm border flex items-center gap-3 ${
                  isLow ? 'border-amber-200' : 'border-zinc-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-zinc-800 truncate">{item.food.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.food.category] || CATEGORY_COLORS.general}`}>
                      {item.food.category}
                    </span>
                    {isLow && <span className="text-xs text-amber-600 font-medium">Stock bajo</span>}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {Math.round(item.food.calories_per_100g)} kcal · {Math.round(item.food.protein_per_100g)}g prot · {Math.round(item.food.carbs_per_100g)}g carb · {Math.round(item.food.fat_per_100g)}g grasa
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editQty}
                      onChange={e => setEditQty(e.target.value)}
                      className="w-20 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      autoFocus
                    />
                    <span className="text-xs text-zinc-400">g</span>
                    <button onClick={() => handleEdit(item)} className="text-emerald-600 hover:text-emerald-700"><Check size={16} /></button>
                    <button onClick={() => setEditId(null)} className="text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setEditId(item.id); setEditQty(String(Math.round(item.quantity_g))) }}
                      className="flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900"
                    >
                      <span className="font-semibold">{Math.round(item.quantity_g)}g</span>
                      <Pencil size={13} className="text-zinc-400" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-zinc-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
