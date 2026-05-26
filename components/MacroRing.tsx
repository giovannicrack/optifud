'use client'

interface MacroRingProps {
  calories: number
  target: number
  size?: number
}

export default function MacroRing({ calories, target, size = 120 }: MacroRingProps) {
  const pct = Math.min(1, calories / target)
  const r = 46
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f4f4f5" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-bold text-zinc-800">{Math.round(calories)}</div>
        <div className="text-xs text-zinc-400">kcal</div>
      </div>
    </div>
  )
}
