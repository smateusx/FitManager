import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

// Vercel runs `next build` prerender before env is guaranteed; createClient() throws on empty URL.
const onVercel = !!process.env.VERCEL
const missingSupabaseEnv = !url || !key
const PLACEHOLDER_URL = 'https://build-placeholder.supabase.co'
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.dummy-signature-for-prerender-only'

const buildSafeUrl = onVercel && missingSupabaseEnv ? PLACEHOLDER_URL : url
const buildSafeKey = onVercel && missingSupabaseEnv ? PLACEHOLDER_KEY : key

if (!buildSafeUrl || !buildSafeKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in Vercel → Project → Environment Variables.'
  )
}

export const supabase = createClient(buildSafeUrl, buildSafeKey)
