import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

function initSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
     
    console.warn(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
        'Forum features will use mock data.',
    );
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase: SupabaseClient | null = initSupabase();
