"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '../../lib/auth'

export default function AuthPage() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'signUp') {
        const res = await signUp(email, password)
        if (res.error) setMessage(res.error.message)
        else setMessage('Check your email for confirmation link.')
      } else {
        const res = await signIn(email, password)
        if (res.error) setMessage(res.error.message)
        else router.push('/dashboard')
      }
    } catch (err) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2 text-center">{mode === 'signIn' ? 'Sign in' : 'Create account'}</h2>
        <p className="text-sm text-zinc-400 text-center mb-4">Simple access for agency users.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-50"
            />
          </div>

          {message && <div className="text-sm text-red-400">{message}</div>}

          <div className="flex items-center justify-between gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-50 rounded"
            >
              {loading ? 'Please wait...' : mode === 'signIn' ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-zinc-400">
          {mode === 'signIn' ? (
            <>
              Don’t have an account?{' '}
              <button className="underline" onClick={() => setMode('signUp')}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="underline" onClick={() => setMode('signIn')}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
