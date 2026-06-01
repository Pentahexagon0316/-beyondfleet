export type AuditActorType = 'user' | 'admin' | 'system' | 'anonymous'

export type AuditLog = {
  actorId: string
  actorType?: AuditActorType
  action: string
  entity: string
  entityId?: string
  timestamp: Date
  previousValue?: unknown
  nextValue?: unknown
  metadata?: Record<string, unknown>
}
