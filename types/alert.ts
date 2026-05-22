import { UUID, Timestamp } from './client';

export type Severity = 'warning' | 'critical';

export interface Alert {
  id: UUID;
  client_id: UUID;
  severity: Severity;
  message: string;
  payload?: Record<string, unknown> | null;
  acknowledged: boolean;
  acknowledged_at?: Timestamp | null;
  created_at: Timestamp;
  updated_at?: Timestamp | null;
}
