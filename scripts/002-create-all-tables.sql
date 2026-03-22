-- Create all tables needed for the ConnectaPod Designer app

-- Deleted modules (soft delete tracking)
CREATE TABLE IF NOT EXISTS public.deleted_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wall entries (wall configurations)
CREATE TABLE IF NOT EXISTS public.wall_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT,
  category TEXT,
  description TEXT,
  width NUMERIC,
  height NUMERIC,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deleted walls (soft delete tracking)
CREATE TABLE IF NOT EXISTS public.deleted_walls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Home designs (saved configurations)
CREATE TABLE IF NOT EXISTS public.home_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  grid JSONB,
  modules JSONB,
  walls JSONB,
  total_width NUMERIC,
  total_depth NUMERIC,
  is_template BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Floor plan images (module floor plan images)
CREATE TABLE IF NOT EXISTS public.floor_plan_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wall images (wall elevation images)
CREATE TABLE IF NOT EXISTS public.wall_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deleted_modules_code ON public.deleted_modules(module_code);
CREATE INDEX IF NOT EXISTS idx_wall_entries_code ON public.wall_entries(code);
CREATE INDEX IF NOT EXISTS idx_deleted_walls_code ON public.deleted_walls(wall_code);
CREATE INDEX IF NOT EXISTS idx_home_designs_template ON public.home_designs(is_template);
CREATE INDEX IF NOT EXISTS idx_floor_plan_images_type ON public.floor_plan_images(module_type);
CREATE INDEX IF NOT EXISTS idx_wall_images_type ON public.wall_images(wall_type);
