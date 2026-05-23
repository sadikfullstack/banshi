"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DashboardShell from '../../../components/DashboardShell'
import supabase from '../../../lib/supabase'
import { getClients, createClient } from '../../../lib/clients'

export default function ExtensionLinkPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  const handle = params.get('handle') ?? ''
  const followers = Number(params.get('followers') ?? 0)
  const bio = params.get('bio') ?? ''

  useEffect(() => {
    let mounted = true
    async function init() {
      setLoading(true)
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(data?.user ?? null)
      if (!data?.user) {
        setLoading(false)
        return
      }
      const res = await getClients()
      if (res.data) setClients(res.data)
      setLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [])

  if (loading) return <DashboardShell><div className="p-6">Loading...</div></DashboardShell>

  if (!user) {
    return (
      <DashboardShell>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Sign in required</h2>
          <p className="mb-4">You must be signed in to link this Instagram profile to one of your clients.</p>
          <a href="/auth" className="px-3 py-2 bg-emerald-700 text-white rounded">Sign in</a>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="p-6">
        <h2 className="text-lg font-medium mb-4">Link Instagram profile</h2>
        <div className="mb-4 text-sm text-zinc-400">Detected profile: <strong>{handle}</strong> ({followers} followers)</div>

        <div className="mb-4">
          <div className="text-sm text-zinc-400 mb-2">Select an existing client:</div>
          {clients.length === 0 && <div className="p-3 bg-zinc-900 rounded text-zinc-400">No clients found.</div>}
          {clients.map(c => (
            <div key={c.id} className="p-3 border border-zinc-800 rounded mb-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-zinc-500">{c.account_id ?? '—'}</div>
              </div>
              <div>
                <button className="px-3 py-1 bg-emerald-700 text-white rounded text-sm" onClick={async () => {
                    // link: update client account_id if empty
                    setLoading(true)
                    try {
                      if (!c.account_id) {
                        // update existing client to attach account_id
                        const { updateClient } = await import('../../../lib/clients')
                        await updateClient(c.id, { account_id: handle })
                      }
                      // after linking, redirect to a special URL that the extension background listens for
                      const qp = new URLSearchParams()
                      qp.set('client_id', c.id)
                      if (handle) qp.set('handle', handle)
                      if (c.name) qp.set('name', c.name)
                      router.push(`/extension/linked?${qp.toString()}`)
                    } finally {
                      setLoading(false)
                    }
                  }}>Link</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="text-sm text-zinc-400 mb-2">Or create a new client from this profile:</div>
          <button className="px-3 py-2 bg-blue-700 text-white rounded" onClick={async () => {
            setCreating(true)
            try {
              const payload = { client_name: handle || `Instagram ${Date.now()}`, platform: 'IG' as const, account_id: handle, notes: bio }
              const res = await createClient(payload)
              if (res.error) {
                alert('Failed to create client: ' + ((res.error as any)?.message || res.error))
                return
              }
              // success: redirect to linked URL that contains the new client id
              const qp = new URLSearchParams()
              qp.set('client_id', res.data.id)
              if (handle) qp.set('handle', handle)
              if (res.data.name) qp.set('name', res.data.name)
              if (res.existed) qp.set('existed', '1')
              router.push(`/extension/linked?${qp.toString()}`)
            } finally { setCreating(false) }
          }}>{creating ? 'Creating...' : 'Create Client'}</button>
        </div>
      </div>
    </DashboardShell>
  )
}
