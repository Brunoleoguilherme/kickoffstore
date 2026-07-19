import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@kickoffstore/types'

export interface AuditInput {
  organizationId?: string | null
  actorUserId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  requestId?: string | null
  before?: Json
  after?: Json
}

/**
 * Writes an audit log row. Uses the service role so it is never blocked by RLS.
 * Sensitive fields must be redacted BEFORE calling this (CLAUDE.md).
 */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  const admin = createAdminClient()
  await admin.from('audit_logs').insert({
    organization_id: input.organizationId ?? null,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    request_id: input.requestId ?? null,
    before_data: input.before ?? null,
    after_data: input.after ?? null,
  })
}
