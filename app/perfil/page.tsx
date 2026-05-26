'use client'

import { useEffect, useState } from 'react'
import { User, Save, Zap } from 'lucide-react'

const GOALS = [
  { value: 'cut', label: 'Bajar peso', desc: '-400 kcal/día' },
  { value: 'maintain', label: 'Mantener', desc: 'TDEE exacto' },
  { value: 'bulk', label: 'Subir masa', desc: '+300 kcal/día' },
]

const ACTIVITIES = [
  { value: 'sedentary', label: 'Sedentario', desc: 'Sin ejercicio' },
  { value: 'light', label: 'Ligero', desc: '1-3 días/sem' },
  { value: 'moderate', label: 'Moderado', desc: '3-5 días/sem' },
  { value: 'active', label: 'Activo', desc: '6-7 días/sem' },
  { value: 'very_active', label: 'Muy activo', desc: 'Atleta/doble sesión' },
]

interface Profile {
  name: string
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

export default function PerfilPage() {
  const [form, setForm] = useState({
    name: '',
    weight_kg: '',
    height_cm: '',
    age: '',
    goal: 'maintain',
    activity_level: 'moderate',
  })
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d) {
        setProfile(d)
        setForm({
          name: d.name || '',
          weight_kg: String(d.weight_kg || ''),
          height_cm: String(d.height_cm || ''),
          age: String(d.age || ''),
          goal: d.goal || 'maintain',
          activity_level: d.activity_level || 'moderate',
        })
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        age: parseInt(form.age),
        goal: form.goal,
        activity_level: form.activity_level,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
          <User size={20} className="text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-800">Mi Perfil</h1>
          <p className="text-zinc-400 text-sm">Datos físicos y objetivos nutricionales</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-4">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Datos personales</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tu nombre"
              className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                value={form.weight_kg}
                onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
                placeholder="75"
                step="0.1"
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Altura (cm)</label>
              <input
                type="number"
                value={form.height_cm}
                onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))}
                placeholder="175"
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Edad</label>
              <input
                type="number"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="25"
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Objetivo</h2>
          <div className="grid grid-cols-3 gap-2">
            {GOALS.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, goal: g.value }))}
                className={`rounded-xl px-3 py-3 text-left transition-all border ${
                  form.goal === g.value
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="text-sm font-semibold text-zinc-800">{g.label}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Nivel de actividad</h2>
          <div className="space-y-2">
            {ACTIVITIES.map(a => (
              <button
                key={a.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, activity_level: a.value }))}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all border ${
                  form.activity_level === a.value
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <span className="text-sm font-medium text-zinc-800">{a.label}</span>
                <span className="text-xs text-zinc-400">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {profile && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Objetivos calculados</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calorías', value: profile.target_calories, unit: 'kcal', color: 'bg-emerald-100 text-emerald-700' },
                { label: 'Proteína', value: profile.target_protein_g, unit: 'g', color: 'bg-blue-100 text-blue-700' },
                { label: 'Carbohidratos', value: profile.target_carbs_g, unit: 'g', color: 'bg-amber-100 text-amber-700' },
                { label: 'Grasas', value: profile.target_fat_g, unit: 'g', color: 'bg-rose-100 text-rose-700' },
              ].map(m => (
                <div key={m.label} className={`rounded-xl p-3 ${m.color}`}>
                  <div className="text-xs opacity-70 mb-0.5">{m.label}</div>
                  <div className="text-lg font-bold">{m.value}<span className="text-xs font-normal ml-1">{m.unit}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-2xl transition-colors disabled:opacity-50"
        >
          {saved ? (
            <>
              <Zap size={18} />
              Guardado
            </>
          ) : (
            <>
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar perfil'}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
