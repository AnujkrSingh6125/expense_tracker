import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 10 &&
  !supabaseUrl.includes('your-project-id')
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase configuration missing or invalid in environment variables.\n' +
    'Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or Vercel project settings.'
  );
}

// Create safe Supabase client with auth session persistence and keep-alive
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'et_auth_token',
      },
      global: {
        headers: {
          'x-client-info': 'expensetracker-web@1.0.0',
        },
      },
    })
  : createClient(
      'https://placeholder-expense-tracker.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
      {
        auth: {
          persistSession: false,
        },
      }
    );

