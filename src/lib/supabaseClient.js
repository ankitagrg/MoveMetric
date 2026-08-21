import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const REMEMBER_ME_KEY = 'movemetric.rememberMe'

// Session storage location follows the "remember me" flag: persisted in
// localStorage (survives browser restarts) when remembered, otherwise
// sessionStorage (cleared when the tab/browser closes).
const rememberAwareStorage = {
  getItem: (key) => {
    const remember = localStorage.getItem(REMEMBER_ME_KEY) === 'true'
    return (remember ? localStorage : sessionStorage).getItem(key)
  },
  setItem: (key, value) => {
    const remember = localStorage.getItem(REMEMBER_ME_KEY) === 'true'
    ;(remember ? localStorage : sessionStorage).setItem(key, value)
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: rememberAwareStorage },
})

export const SESSION_EXPIRED_ERROR = { message: 'Your session has expired. Please sign in again.' }

// Every trainer-scoped query needs the current user's id. Returns null
// instead of throwing when the session is invalid/expired (e.g. a revoked
// refresh token) so callers can show SESSION_EXPIRED_ERROR instead of
// crashing on `user.id` of a null user.
export async function getAuthedUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
