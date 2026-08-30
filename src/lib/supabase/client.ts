import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from './database.types'

const environmentSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

const environment = environmentSchema.safeParse(import.meta.env)

export const supabaseConfiguration = environment.success
  ? environment.data
  : null

export const supabase = supabaseConfiguration
  ? createClient<Database>(
      supabaseConfiguration.VITE_SUPABASE_URL,
      supabaseConfiguration.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.')
  }

  return supabase
}
