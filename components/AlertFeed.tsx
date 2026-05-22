"use client"

import React from 'react'

export type AlertRow = {
  id: string
  title: string
  severity: 'warning' | 'critical'
  message: string
  created_at?: string
}

type Props = {
  alerts: AlertRow[]
}

export default function AlertFeed({ alerts }: Props) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded text-center text-zinc-400">No recent alerts</div>
    )
  }

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
      <h3 className="text-lg font-medium mb-3">Recent Alerts</h3>
      <div className="max-h-64 overflow-y-auto space-y-3">
        {alerts.map(a => (
          <div key={a.id} className="p-3 border border-zinc-800 rounded">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-zinc-400 mt-1">{a.message}</div>
              </div>
              <div className="text-right">
                <div className={`px-2 py-1 rounded text-xs ${a.severity === 'critical' ? 'bg-red-800 text-red-200' : 'bg-amber-800 text-amber-200'}`}>
                  {a.severity}
                </div>
                <div className="text-xs text-zinc-500 mt-2">{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
