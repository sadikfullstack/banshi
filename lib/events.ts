import supabase from './supabase'
import type { Result } from './clients'

type EventRow = {
  id: string
  client_id: string
  metadata: any
  created_at: string
}

export async function getLatestEventsForClients(clientIds: string[]): Promise<{ [clientId: string]: EventRow | null }> {
  if (!clientIds || clientIds.length === 0) return {}
  // Fetch the most recent event per client (PostgREST doesn't support distinct on easily, so query sorted and reduce)
  const { data, error } = await supabase
    .from('events')
    .select('id, client_id, metadata, created_at')
    .in('client_id', clientIds)
    .order('created_at', { ascending: false })
    .limit(1000)

  const out: { [k: string]: EventRow | null } = {}
  if (error || !data) {
    clientIds.forEach(id => { out[id] = null })
    return out
  }

  for (const id of clientIds) out[id] = null
  for (const row of data as EventRow[]) {
    if (!out[row.client_id]) out[row.client_id] = row
  }
  return out
}

export default { getLatestEventsForClients }
