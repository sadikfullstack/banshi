import type { Alert } from '../types/alert'
import type { RiskLevel } from '../types/client'

/**
 * Deterministic, pure function to compute client risk level from alerts.
 * Rules:
 * - 0 alerts => Healthy
 * - 1 warning => Watch
 * - 2 warnings => Risk
 * - any critical => Critical
 */
export function computeRiskLevel(alerts: Alert[] = []): RiskLevel {
  if (alerts.length === 0) return 'Healthy'

  // Any critical alert makes the client Critical
  for (const a of alerts) {
    if (a.severity === 'critical') return 'Critical'
  }

  // Count warnings deterministically
  const warnings = alerts.reduce((count, a) => count + (a.severity === 'warning' ? 1 : 0), 0)

  if (warnings >= 2) return 'Risk'
  if (warnings === 1) return 'Watch'

  return 'Healthy'
}

export default computeRiskLevel

export function computeRiskScoreFromSnapshot(opts: { currentEvent: any; previousEvent?: any; alerts?: Alert[] }) {
  const { currentEvent, previousEvent, alerts = [] } = opts || {}
  const meta = (currentEvent && currentEvent.metadata) ? currentEvent.metadata : {}
  const followers = typeof meta.followers === 'number' ? meta.followers : null
  const following = typeof meta.following === 'number' ? meta.following : null
  const posts = typeof meta.posts === 'number' ? meta.posts : null
  const bio = typeof meta.bio === 'string' ? meta.bio : ''
  const recent_posts = Array.isArray(meta.recent_posts) ? meta.recent_posts : null
  const avg_likes = typeof meta.avg_likes === 'number' ? meta.avg_likes : null
  const avg_comments = typeof meta.avg_comments === 'number' ? meta.avg_comments : null

  const reasons: string[] = []
  let score = 0

  // Follower change percentage vs previous snapshot
  let deltaPct: number | null = null
  if (previousEvent && previousEvent.metadata && typeof previousEvent.metadata.followers === 'number' && typeof followers === 'number') {
    const prevFollowers = previousEvent.metadata.followers
    if (prevFollowers > 0) deltaPct = ((followers - prevFollowers) / prevFollowers) * 100
  }

  if (typeof deltaPct === 'number') {
    if (deltaPct > 20) {
      score += 40
      reasons.push('big follower spike')
    } else if (deltaPct > 10) {
      score += 20
      reasons.push('moderate follower spike')
    } else if (deltaPct < -15) {
      score += 25
      reasons.push('rapid follower loss')
    }
  }

  // follower/following ratio
  if (typeof followers === 'number' && typeof following === 'number') {
    const ratio = followers / Math.max(1, following)
    if (followers > 1000 && ratio < 0.05) {
      score += 30
      reasons.push('low follower/following ratio')
    }
    if (following > (followers * 3) && followers < 500) {
      score += 20
      reasons.push('follows many accounts')
    }
  }

  // posts per day spike (approx)
  if (typeof posts === 'number' && previousEvent && typeof previousEvent.metadata.posts === 'number') {
    const prevPosts = previousEvent.metadata.posts
    const postsDelta = posts - prevPosts
    const curTs = new Date(currentEvent.created_at).getTime()
    const prevTs = new Date(previousEvent.created_at).getTime()
    const days = Math.max(0.001, (curTs - prevTs) / 86400000)
    const postsPerDay = postsDelta / days
    if (postsPerDay > 5) {
      score += 15
      reasons.push('sudden posting burst')
    } else if (postsPerDay > 2) {
      score += 8
      reasons.push('increased posting')
    }
  }

  // bio checks
  if (bio && typeof bio === 'string') {
    if (/(follow4follow|follow for follow|free followers|buy followers|promo|promotion|dm for)/i.test(bio)) {
      score += 25
      reasons.push('suspicious bio keywords')
    }
    if (/(https?:\/\/|www\.)/i.test(bio)) {
      score += 15
      reasons.push('bio contains external link')
    }
  }

  // engagement checks (avg likes vs followers)
  if (typeof avg_likes === 'number' && typeof followers === 'number' && followers > 0) {
    const engagementRate = avg_likes / Math.max(1, followers)
    if (followers > 1000 && engagementRate < 0.005) {
      score += 30
      reasons.push('low engagement')
    } else if (engagementRate < 0.01) {
      score += 10
      reasons.push('low engagement')
    }
  }

  // incorporate existing alerts as additive risk
  if (Array.isArray(alerts) && alerts.length > 0) {
    for (const a of alerts) {
      if (a.severity === 'critical') score += 50
      else if (a.severity === 'warning') score += 10
    }
  }

  score = Math.min(100, score)

  let level: RiskLevel = 'Healthy'
  if (score >= 80) level = 'Critical'
  else if (score >= 60) level = 'Risk'
  else if (score >= 30) level = 'Watch'

  const reason = reasons.length > 0 ? reasons.join(', ') : 'no suspicious signals'

  return { score, reason, level }
}
