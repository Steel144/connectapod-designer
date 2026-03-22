import { createClient } from '@supabase/supabase-js';

// Support both Vite (VITE_*) and standard Vercel env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
                    import.meta.env.SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                        import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                        import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Helper to add _id alias for Base44 compatibility
const addIdAlias = (item) => item ? { ...item, _id: item.id } : item;
const addIdAliases = (items) => (items || []).map(addIdAlias);

// Generic entity factory for CRUD operations
const createEntity = (tableName) => ({
  async list() {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return addIdAliases(data);
  },

  async create(record) {
    const { data, error } = await supabase
      .from(tableName)
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return addIdAlias(data);
  },

  async update(id, record) {
    const { data, error } = await supabase
      .from(tableName)
      .update({ ...record, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return addIdAlias(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async filter(filters) {
    let query = supabase.from(tableName).select('*');
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return addIdAliases(data);
  }
});

// Module Entry with custom sorting
export const ModuleEntry = {
  async list() {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('category', { ascending: true })
      .order('code', { ascending: true });
    if (error) throw error;
    return addIdAliases(data);
  },

  async create(moduleData) {
    const { data, error } = await supabase
      .from('modules')
      .insert([moduleData])
      .select()
      .single();
    if (error) throw error;
    return addIdAlias(data);
  },

  async update(id, moduleData) {
    const { data, error } = await supabase
      .from('modules')
      .update({ ...moduleData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return addIdAlias(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async filter(filters) {
    let query = supabase.from('modules').select('*');
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.code) query = query.eq('code', filters.code);
    const { data, error } = await query.order('code', { ascending: true });
    if (error) throw error;
    return addIdAliases(data);
  }
};

// Wall Entry
export const WallEntry = {
  ...createEntity('wall_entries'),
  
  async list() {
    const { data, error } = await supabase
      .from('wall_entries')
      .select('*')
      .order('category', { ascending: true })
      .order('code', { ascending: true });
    if (error) throw error;
    return addIdAliases(data);
  }
};

// Deleted Module tracking
export const DeletedModule = createEntity('deleted_modules');

// Deleted Wall tracking
export const DeletedWall = createEntity('deleted_walls');

// Home Design
export const HomeDesign = {
  ...createEntity('home_designs'),
  
  async list() {
    const { data, error } = await supabase
      .from('home_designs')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return addIdAliases(data);
  },
  
  async getTemplates() {
    const { data, error } = await supabase
      .from('home_designs')
      .select('*')
      .eq('is_template', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return addIdAliases(data);
  }
};

// Floor Plan Image
export const FloorPlanImage = {
  ...createEntity('floor_plan_images'),
  
  async getByModuleType(moduleType) {
    const { data, error } = await supabase
      .from('floor_plan_images')
      .select('*')
      .eq('module_type', moduleType)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return addIdAlias(data);
  }
};

// Wall Image
export const WallImage = {
  ...createEntity('wall_images'),
  
  async getByWallType(wallType) {
    const { data, error } = await supabase
      .from('wall_images')
      .select('*')
      .eq('wall_type', wallType)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return addIdAlias(data);
  }
};

// Storage helper for file uploads
export const Storage = {
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  },
  
  async deleteFile(bucket, path) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    if (error) throw error;
    return true;
  }
};

// Export a compatible base44-like object for easier migration
export const base44 = {
  entities: {
    ModuleEntry,
    WallEntry,
    DeletedModule,
    DeletedWall,
    HomeDesign,
    FloorPlanImage,
    WallImage
  },
  storage: Storage
};

export default supabase;
