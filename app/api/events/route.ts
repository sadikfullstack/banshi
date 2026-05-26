import { NextResponse } from 'next/server'
import supabase from '../../../lib/supabase'
import { updateRiskStatusForClient } from '../../../lib/updateRiskStatus'
import { computeRiskScoreFromSnapshot } from '../../../lib/riskEngine'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function makeAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

type Incoming = {
  client_id: string
  type: 'PROFILE_SNAPSHOT'
  metadata: {
    followers: number | null
    following: number | null
    posts: number | null
    bio: string
    handle: string
  }
  timestamp?: number
}

function isValidIncoming(obj: any): obj is Incoming {
  if (!obj || typeof obj !== 'object') return false
  if (typeof obj.client_id !== 'string' || obj.client_id.length === 0) return false
  if (obj.type !== 'PROFILE_SNAPSHOT') return false
  if (!obj.metadata || typeof obj.metadata !== 'object') return false
  const m = obj.metadata
  const numOrNull = (v: any) => v === null || typeof v === 'number'
  if (!numOrNull(m.followers)) return false
  if (!numOrNull(m.following)) return false
  if (!numOrNull(m.posts)) return false
  if (typeof m.bio !== 'string') return false
  if (typeof m.handle !== 'string') return false
  if (obj.timestamp !== undefined && typeof obj.timestamp !== 'number') return false
  return true
}

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isValidIncoming(body)) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }

  const incoming: Incoming = body
  const event = {
    client_id: incoming.client_id,
    type: 'PROFILE_SNAPSHOT',
    value: null,
    metadata: incoming.metadata,
    created_at: new Date(incoming.timestamp ? incoming.timestamp : Date.now()).toISOString(),
  }

  try {
    // Use a service-role admin client server-side to bypass RLS for inserts.
    const admin = makeAdminClient()
    const db = admin ?? supabase

    // Ensure client exists and fetch its user_id
    const { data: clientRow, error: clientErr } = await db.from('clients').select('user_id').eq('id', event.client_id).maybeSingle()
    if (clientErr) {
      console.warn('failed to lookup client for event', clientErr)
      return NextResponse.json({ success: false, error: 'Client lookup failed' }, { status: 500, headers: CORS_HEADERS })
    }
    if (!clientRow) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 400, headers: CORS_HEADERS })
    }

    // Try inserting the event including user_id. If the DB schema hasn't been migrated
    // (PGRST204 complaining about missing column), retry without user_id.
    let evData: any = null
    let evError: any = null
    try {
      const res = await db.from('events').insert({
        client_id: event.client_id,
        user_id: clientRow.user_id,
        type: event.type,
        metadata: event.metadata,
        created_at: event.created_at,
      }).select().single()
      evData = res.data
      evError = res.error
    } catch (e) {
      console.warn('events insert threw', e)
      evError = e
    }

    if (evError) {
      // If schema cache is missing 'user_id' column, retry without it (best-effort)
      const isSchemaMissing = (evError && ((evError.code === 'PGRST204') || (evError.message && String(evError.message).includes("Could not find the 'user_id'"))))
      if (isSchemaMissing) {
        try {
          const r2 = await db.from('events').insert({
            client_id: event.client_id,
            type: event.type,
            metadata: event.metadata,
            created_at: event.created_at,
          }).select().single()
          evData = r2.data
          evError = r2.error
        } catch (e) {
          console.warn('events insert retry threw', e)
          evError = e
        }
      }
    }

    // Update client's last_checked timestamp regardless of whether event insert succeeded
    try {
      await db.from('clients').update({ last_checked: event.created_at }).eq('id', event.client_id)
    } catch (e) {
      console.warn('failed to update clients.last_checked', e)
    }

    if (!evData || evError) {
      console.warn('failed to insert event', evError)
      return NextResponse.json({ success: false, error: 'Failed to insert event' }, { status: 500, headers: CORS_HEADERS })
    }

    // Update risk status: compute derived features and numeric score (best-effort)
    try {
      // fetch previous snapshot for deltas
      let prevEvent: any = null
      try {
        const prevRes = await db.from('events')
          .select('*')
          .eq('client_id', event.client_id)
          .neq('id', evData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (prevRes && prevRes.data) prevEvent = prevRes.data
      } catch (e) {
        // ignore
      }

      // fetch recent alerts for this client to include in scoring
      let recentAlerts: any[] = []
      try {
        const ares = await db.from('alerts').select('*').eq('client_id', event.client_id).order('created_at', { ascending: false }).limit(50)
        if (ares && ares.data) recentAlerts = ares.data
      } catch (e) {
        // ignore
      }

      const scoreRes = computeRiskScoreFromSnapshot({ currentEvent: evData, previousEvent: prevEvent, alerts: recentAlerts })
      try {
        await db.from('risk_status').upsert({ client_id: event.client_id, status: scoreRes.level, score: scoreRes.score, notes: scoreRes.reason }, { onConflict: 'client_id' })
      } catch (e) {
        console.warn('failed to upsert risk_status', e)
      }

      // Return inserted event and derived risk summary
      return NextResponse.json({ success: true, event: evData, risk: { score: scoreRes.score, level: scoreRes.level, reason: scoreRes.reason } }, { status: 201, headers: CORS_HEADERS })
    } catch (e) {
      console.warn('risk scoring failed', e)
      return NextResponse.json({ success: true, event: evData }, { status: 201, headers: CORS_HEADERS })
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('insert exception', e)
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500, headers: CORS_HEADERS })
  }

  // Trigger risk recompute (best-effort) using admin client if available
  try {
    const admin = makeAdminClient()
    if (admin) await updateRiskStatusForClient(event.client_id, admin)
    else await updateRiskStatusForClient(event.client_id)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('updateRiskStatusForClient failed', e)
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
}

// respond to preflight CORS requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
