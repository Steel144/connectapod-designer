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

// Module API wrapper to match the Base44 API interface
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
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.code) {
      query = query.eq('code', filters.code);
    }
    
    const { data, error } = await query.order('code', { ascending: true });
    
    if (error) throw error;
    return addIdAliases(data);
  }
};
