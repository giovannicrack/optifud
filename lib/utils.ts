import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMacro(value: number, unit = 'g') {
  return `${Math.round(value)}${unit}`
}

export function calcMacros(items: Array<{ quantity_g: number; food: { protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number; calories_per_100g: number } }>) {
  return items.reduce(
    (acc, item) => {
      const factor = item.quantity_g / 100
      return {
        protein: acc.protein + item.food.protein_per_100g * factor,
        carbs: acc.carbs + item.food.carbs_per_100g * factor,
        fat: acc.fat + item.food.fat_per_100g * factor,
        calories: acc.calories + item.food.calories_per_100g * factor,
      }
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  )
}
