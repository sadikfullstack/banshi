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
