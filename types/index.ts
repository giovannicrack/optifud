export interface Food {
  id: string
  name: string
  category: string
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  calories_per_100g: number
  fiber_per_100g: number
  unit: string
}

export interface StockItem {
  id: string
  food_id: string
  quantity_g: number
  expiry_date: string | null
  food: Food
}

export interface UserProfile {
  id: string
  name: string
  weight_kg: number
  height_cm: number
  age: number
  goal: 'cut' | 'maintain' | 'bulk'
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  target_calories: number
  target_protein_g: number
  target_carbs_g: number
  target_fat_g: number
}

export interface MealPlan {
  id: string
  date: string
  status: 'draft' | 'accepted'
  meals: Meal[]
}

export interface Meal {
  id: string
  plan_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  accepted: boolean
  items: MealItem[]
}

export interface MealItem {
  id: string
  meal_id: string
  food_id: string
  quantity_g: number
  food: Food
}

export interface MacroSummary {
  protein: number
  carbs: number
  fat: number
  calories: number
}

export interface ShoppingSuggestion {
  food: Food
  suggested_quantity_g: number
  reason: string
}
