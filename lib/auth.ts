import supabase from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

type AuthResult = {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return {
    user: data.user ?? null,
    session: (data as any).session ?? null,
    error: error ?? null,
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return {
    user: data.user ?? null,
    session: data.session ?? null,
    error: error ?? null,
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut()
  return { error: error ?? null }
}

export default { signUp, signIn, signOut }
