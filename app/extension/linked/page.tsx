"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LinkedPage() {
  const params = useSearchParams()
  const clientId = params.get('client_id')
  const existed = params.get('existed') === '1'

  useEffect(() => {
    // show a simple confirmation; background will listen to tab updates and store the client id
  }, [clientId])

  return (
    <div className="p-6">
      <h1 className="text-lg font-medium mb-3">Linked</h1>
      <p className="text-sm text-zinc-400">This Instagram profile was linked to client id <strong>{clientId}</strong>.</p>
      {existed && <p className="mt-2 text-sm text-amber-400">Note: an existing client was used (no duplicate created).</p>}
      <p className="mt-4 text-xs text-zinc-500">You can close this tab. The extension has been updated.</p>
    </div>
  )
}
