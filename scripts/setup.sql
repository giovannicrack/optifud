-- ============================================
-- OptiFud - Setup completo de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Catálogo de alimentos
CREATE TABLE IF NOT EXISTS foods_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  protein_per_100g NUMERIC NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC NOT NULL DEFAULT 0,
  fat_per_100g NUMERIC NOT NULL DEFAULT 0,
  calories_per_100g NUMERIC NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'g',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stock del usuario
CREATE TABLE IF NOT EXISTS stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES foods_catalog(id) ON DELETE CASCADE,
  quantity_g NUMERIC NOT NULL DEFAULT 0,
  expiry_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Perfil del usuario (fila única)
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  age INTEGER,
  goal TEXT DEFAULT 'maintain',
  activity_level TEXT DEFAULT 'moderate',
  target_calories INTEGER DEFAULT 2000,
  target_protein_g INTEGER DEFAULT 150,
  target_carbs_g INTEGER DEFAULT 200,
  target_fat_g INTEGER DEFAULT 65,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Planes de comida
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Comidas dentro de un plan
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL DEFAULT 'lunch',
  name TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Items de cada comida
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods_catalog(id) ON DELETE CASCADE,
  quantity_g NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Log de facturas escaneadas
CREATE TABLE IF NOT EXISTS invoice_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_text TEXT,
  items_detected JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificar que se crearon todas las tablas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('foods_catalog','stock','user_profile','meal_plans','meals','meal_items','invoice_scans')
ORDER BY table_name;
