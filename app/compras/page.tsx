'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, RefreshCw, Loader2, AlertTriangle, Info } from 'lucide-react'

interface Suggestion {
  food_name: string
  category: string
  suggested_quantity_g: number
  reason: string
  priority: 'alta' | 'media' | 'baja'
}

const PRIORITY_STYLES = {
  alta: { badge: 'bg-red-100 text-red-700', border: 'border-red-100', icon: <AlertTriangle size={14} className="text-red-500" /> },
  media: { badge: 'bg-amber-100 text-amber-700', border: 'border-amber-100', icon: <AlertTriangle size={14} className="text-amber-500" /> },
  baja: { badge: 'bg-zinc-100 text-zinc-600', border: 'border-zinc-100', icon: <Info size={14} className="text-zinc-400" /> },
}

const CATEGORY_LABELS: Record<string, string> = {
  proteina: 'Proteína',
  lacteo: 'Lácteo',
  carbohidrato: 'Carbohidrato',
  legumbre: 'Legumbre',
  verdura: 'Verdura',
  fruta: 'Fruta',
  grasa: 'Grasa',
  'fruto seco': 'Fruto seco',
  general: 'General',
}

export default function ComprasPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/shopping')
    if (res.ok) {
      const data = await res.json()
      setSuggestions(data.suggestions || [])
    }
    setLoading(false)
  }

  const alta = suggestions.filter(s => s.priority === 'alta')
  const media = suggestions.filter(s => s.priority === 'media')
  const baja = suggestions.filter(s => s.priority === 'baja')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
            <ShoppingCart size={20} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-800">Lista de compras</h1>
            <p className="text-zinc-400 text-sm">{suggestions.length} sugerencias</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-zinc-500 hover:text-zinc-700 p-2 rounded-xl hover:bg-zinc-100 transition-colors"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 py-16">
          <Loader2 size={32} className="mx-auto animate-spin mb-2 opacity-40" />
          Analizando tu stock...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 text-center space-y-3">
          <ShoppingCart size={48} className="mx-auto text-zinc-200" />
          <div>
            <p className="font-semibold text-zinc-700">Stock al día</p>
            <p className="text-sm text-zinc-400 mt-1">No hay sugerencias urgentes de compra</p>
          </div>
        </div>
      ) : (
        <>
          {alta.length > 0 && <SuggestionGroup title="Urgente" suggestions={alta} />}
          {media.length > 0 && <SuggestionGroup title="Recomendado" suggestions={media} />}
          {baja.length > 0 && <SuggestionGroup title="Opcional" suggestions={baja} />}
        </>
      )}

      {suggestions.length > 0 && (
        <div className="bg-zinc-50 rounded-2xl p-4 text-sm text-zinc-500">
          <p className="font-medium text-zinc-600 mb-1">Total sugerido</p>
          <p>
            {suggestions.reduce((acc, s) => acc + s.suggested_quantity_g, 0) / 1000 >= 1
              ? `~${(suggestions.reduce((acc, s) => acc + s.suggested_quantity_g, 0) / 1000).toFixed(1)} kg`
              : `~${suggestions.reduce((acc, s) => acc + s.suggested_quantity_g, 0)} g`
            } de alimentos a reponer
          </p>
        </div>
      )}
    </div>
  )
}

function SuggestionGroup({ title, suggestions }: { title: string; suggestions: Suggestion[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest px-1">{title}</h2>
      {suggestions.map((s, i) => {
        const style = PRIORITY_STYLES[s.priority]
        return (
          <div key={i} className={`bg-white rounded-2xl px-4 py-4 shadow-sm border ${style.border} flex gap-3 items-start`}>
            <div className="mt-0.5">{style.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-zinc-800">{s.food_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                  {s.priority}
                </span>
                <span className="text-xs text-zinc-400">{CATEGORY_LABELS[s.category] ?? s.category}</span>
              </div>
              <p className="text-sm text-zinc-500 mt-1">{s.reason}</p>
              <p className="text-xs text-zinc-400 mt-1">
                Cantidad sugerida: <span className="font-medium text-zinc-600">{s.suggested_quantity_g >= 1000 ? `${s.suggested_quantity_g / 1000} kg` : `${s.suggested_quantity_g} g`}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
