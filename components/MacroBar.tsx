'use client'

import { cn } from '@/lib/utils'

interface MacroBarProps {
  label: string
  current: number
  target: number
  unit?: string
  color: string
}

export default function MacroBar({ label, current, target, unit = 'g', color }: MacroBarProps) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  const over = current > target

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">{label}</span>
        <span className={cn(over && 'text-orange-500')}>
          {Math.round(current)}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color, over && 'opacity-70')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-zinc-400">{pct}%</div>
    </div>
  )
}
