-- Create modules table for ConnectaPod module catalogue
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  width DECIMAL(4,2) NOT NULL,
  depth DECIMAL(4,2) NOT NULL,
  description TEXT,
  price INTEGER DEFAULT 0,
  chassis TEXT,
  width_code TEXT,
  room TEXT,
  floor_plan_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_modules_category ON modules(category);

-- Create index on code for lookups
CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(code);

-- Enable Row Level Security (but allow public read for this catalogue)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON modules;
DROP POLICY IF EXISTS "Allow authenticated insert" ON modules;
DROP POLICY IF EXISTS "Allow authenticated update" ON modules;
DROP POLICY IF EXISTS "Allow authenticated delete" ON modules;

-- Allow anyone to read modules (public catalogue)
CREATE POLICY "Allow public read access" ON modules
  FOR SELECT USING (true);

-- Allow anyone to insert/update/delete for now (admin operations)
CREATE POLICY "Allow authenticated insert" ON modules
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON modules
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON modules
  FOR DELETE USING (true);
