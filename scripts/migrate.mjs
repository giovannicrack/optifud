import pg from 'pg'
const { Client } = pg

const client = new Client({
  host: 'db.xxfliofpkqxjjtjbjqjd.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'keqgu0-puFjiq-vehser',
  ssl: { rejectUnauthorized: false },
})

const SQL = `
-- Foods catalog
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

-- User stock
CREATE TABLE IF NOT EXISTS stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES foods_catalog(id) ON DELETE CASCADE,
  quantity_g NUMERIC NOT NULL DEFAULT 0,
  expiry_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profile (single row per user)
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

-- Meal plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals within a plan
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL DEFAULT 'lunch',
  name TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items within a meal
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods_catalog(id) ON DELETE CASCADE,
  quantity_g NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice scans log
CREATE TABLE IF NOT EXISTS invoice_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_text TEXT,
  items_detected JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`

async function run() {
  try {
    console.log('Connecting to Supabase...')
    await client.connect()
    console.log('Connected. Running migration...')
    await client.query(SQL)
    console.log('Migration complete!')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
