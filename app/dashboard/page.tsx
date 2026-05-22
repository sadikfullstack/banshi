"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '../../components/DashboardShell'
import supabase from '../../lib/supabase'
import { signOut } from '../../lib/auth'
import AddClientModal from '../../components/AddClientModal'
import { createClient, getClients } from '../../lib/clients'
import ClientTable, { ClientRow } from '../../components/ClientTable'
import { getRecentAlerts } from '../../lib/alerts'
import AlertFeed from '../../components/AlertFeed'

type AlertItem = {
  id: string
  title: string
  message: string
  severity: 'warning' | 'critical'
  created_at?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<number>(0)
  const [healthyCount, setHealthyCount] = useState<number>(0)
  const [riskCount, setRiskCount] = useState<number>(0)
  const [criticalCount, setCriticalCount] = useState<number>(0)
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [clientRows, setClientRows] = useState<ClientRow[]>([])

  useEffect(() => {
    let mounted = true
    async function fetchData() {
      setLoading(true)
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      if (!data.user) {
        router.push('/auth')
        return
      }

      // clients
      const clientsRes = await getClients()
      if (mounted && clientsRes.data) {
        const rows = clientsRes.data.map(c => ({ id: c.id, name: c.name, platform: c.platform ?? 'Meta', riskStatus: null, lastChecked: c.updated_at ?? c.created_at, latestAlert: null }))
        setClientRows(rows)
        setAccounts(rows.length)
      }

      // recent alerts
      const alertsRes = await getRecentAlerts()
      if (mounted && alertsRes.data) {
        setRecentAlerts(alertsRes.data.map(a => ({ id: a.id, title: a.message.split('\n')[0] ?? a.message, message: a.message, severity: a.severity, created_at: a.created_at })))
      }

      // risk counts (query risk_status for user's clients)
      if (clientsRes.data && clientsRes.data.length > 0) {
        const clientIds = clientsRes.data.map(c => c.id)
        const { data: rsData, error: rsErr } = await supabase
          .from('risk_status')
          .select('status, client_id')
          .in('client_id', clientIds)
        if (!rsErr && rsData) {
          const healthy = rsData.filter((r: any) => r.status === 'Healthy').length
          const risk = rsData.filter((r: any) => r.status === 'Risk').length
          const critical = rsData.filter((r: any) => r.status === 'Critical').length
          setHealthyCount(healthy)
          setRiskCount(risk)
          setCriticalCount(critical)
        }
      }

      setLoading(false)
    }
    fetchData()
    return () => {
      mounted = false
    }
  }, [router])

  if (loading) {
    return (
      <DashboardShell>
        <div className="p-6">Loading...</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1 bg-emerald-700 text-white rounded text-sm"
            >
              Add Client
            </button>
            <button
              onClick={async () => {
                await signOut()
                router.push('/auth')
              }}
              className="px-3 py-1 border border-zinc-800 rounded text-sm"
            >
              Sign out
            </button>
          </div>
        </div>

        {createError && (
          <div className="mb-4 p-3 bg-rose-900 text-rose-100 rounded">Failed creating client: {createError}</div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
            <div className="text-sm text-zinc-400">Total clients</div>
            <div className="text-2xl font-semibold">{accounts}</div>
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
            <div className="text-sm text-zinc-400">Healthy</div>
            <div className="text-2xl font-semibold">{healthyCount}</div>
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
            <div className="text-sm text-zinc-400">At-risk</div>
            <div className="text-2xl font-semibold">{riskCount}</div>
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
            <div className="text-sm text-zinc-400">Critical</div>
            <div className="text-2xl font-semibold">{criticalCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <h2 className="text-lg font-medium mb-4">Clients</h2>
            <ClientTable clients={clientRows} loading={loading} />
          </section>
        </div>

        {/* Lower section: recent alerts */}
        <div className="mt-6">
          <AlertFeed alerts={recentAlerts} />
        </div>
        
      </div>
      <AddClientModal
        open={showAddModal}
        onClose={() => {
          if (!creatingClient) setShowAddModal(false)
        }}
        onSubmit={async (data) => {
          setCreateError(null)
          setCreatingClient(true)
          try {
            const res = await createClient(data)
            if (res.error) {
              // show error and keep modal open for retry
              const msg = (res.error as any)?.message ?? String(res.error)
              console.error('createClient error', res.error)
              setCreateError(msg)
              return
            }

            // success: close modal then refresh list
            setShowAddModal(false)
            const list = await getClients()
            if (list.data) {
              const rows = list.data.map(c => ({ id: c.id, name: c.name, platform: c.platform ?? 'Meta', riskStatus: null, lastChecked: c.updated_at ?? c.created_at, latestAlert: null }))
              setClientRows(rows)
              setAccounts(rows.map(r => ({ id: r.id, name: r.name, status: 'healthy', revenue: '$0', lastActive: 'now' })))
            }
          } finally {
            setCreatingClient(false)
          }
        }}
      />
    </DashboardShell>
  )
}
