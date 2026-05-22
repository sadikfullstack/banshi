import supabase from './supabase'
import { computeRiskLevel } from './riskEngine'
import type { Alert } from '../types/alert'
import type { RiskStatus } from '../types/client'

type Result<T> = { data?: T; error?: Error }

async function fetchAlertsForClient(clientId: string): Promise<Result<Alert[]>> {
  const { data, error } = await supabase
    .from<Alert>('alerts')
    .select('*')
    .eq('client_id', clientId)

  if (error) return { error }
  return { data: data ?? [] }
}

async function upsertRiskStatus(clientId: string, status: RiskStatus['status'], score = 0): Promise<Result<RiskStatus>> {
  const payload = {
    client_id: clientId,
    status,
    score,
    notes: null,
  }

  const { data, error } = await supabase
    .from<RiskStatus>('risk_status')
    .upsert(payload, { onConflict: 'client_id' })
    .select()
    .single()

  if (error) return { error }
  return { data: data as RiskStatus }
}

/**
 * Fetches alerts for a client, computes risk via riskEngine, and upserts the risk_status row.
 * Pure computation is delegated to computeRiskLevel; this function performs DB I/O.
 */
export async function updateRiskStatusForClient(clientId: string): Promise<Result<RiskStatus>> {
  const alertsRes = await fetchAlertsForClient(clientId)
  if (alertsRes.error) return { error: alertsRes.error }

  const alerts = alertsRes.data ?? []
  const level = computeRiskLevel(alerts)
  const score = alerts.length

  const upsertRes = await upsertRiskStatus(clientId, level, score)
  if (upsertRes.error) return { error: upsertRes.error }
  return { data: upsertRes.data }
}

export default updateRiskStatusForClient
