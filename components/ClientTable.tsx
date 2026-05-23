"use client"

import React from 'react'

export type ClientRow = {
  id: string
  name: string
  platform: string
  riskStatus?: string | null
  lastChecked?: string | null
  latestAlert?: string | null
  followers?: number | null
}

type Props = {
  clients: ClientRow[]
  loading?: boolean
}

export default function ClientTable({ clients, loading = false }: Props) {
  if (loading) {
    return (
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-1/3 bg-zinc-800 rounded" />
          <div className="h-40 bg-zinc-800 rounded" />
        </div>
      </div>
    )
  }

  if (!loading && clients.length === 0) {
    return (
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded text-center text-zinc-400">
        No clients yet. Click "Add Client" to get started.
      </div>
    )
  }

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-zinc-400">
              <th className="pb-2">Client Name</th>
              <th className="pb-2">Platform</th>
              <th className="pb-2">Risk Status</th>
              <th className="pb-2">Last Checked</th>
              <th className="pb-2">Latest Alert</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-t border-zinc-800">
                <td className="py-3 flex items-center gap-3">
                  <div className="text-sm text-zinc-400">{c.name}</div>
                  {typeof c.followers === 'number' && (
                    <div className="text-xs text-zinc-500">{c.followers.toLocaleString()} followers</div>
                  )}
                </td>
                <td className="py-3">{c.platform}</td>
                <td className="py-3">{c.riskStatus ?? '—'}</td>
                <td className="py-3">{c.lastChecked ? new Date(c.lastChecked).toLocaleString() : '—'}</td>
                <td className="py-3">{c.latestAlert ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {clients.map(c => (
          <div key={c.id} className="p-3 border border-zinc-800 rounded">
            <div className="flex justify-between">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-zinc-400">{c.platform}</div>
            </div>
            <div className="mt-2 text-xs text-zinc-400">Risk: {c.riskStatus ?? '—'}</div>
            <div className="mt-1 text-xs text-zinc-400">Last: {c.lastChecked ? new Date(c.lastChecked).toLocaleString() : '—'}</div>
            <div className="mt-1 text-xs text-zinc-400">Alert: {c.latestAlert ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
