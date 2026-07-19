import { z } from 'zod'

/**
 * Environment validation (CLAUDE.md Fase 1 requirement).
 *
 * Design goals:
 *  - Never crash `pnpm build` just because secrets are absent locally.
 *  - Treat EMPTY strings (e.g. `FOO=` in .env) as "not provided".
 *  - Enforce required server secrets lazily, at first use, with a clear error.
 *  - Keep the service role and other private keys strictly server-side.
 */

/** Coerce empty/whitespace-only env values to undefined before validation. */
const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional())

/* ---- Client (safe to expose; only NEXT_PUBLIC_*) ---- */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(emptyToUndefined, z.string().url().default('http://localhost:3000')),
  NEXT_PUBLIC_APP_NAME: z.preprocess(emptyToUndefined, z.string().default('Kickoffstore')),
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
})

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
})

export type ClientEnv = typeof clientEnv

/* ---- Server (never sent to the browser) ---- */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url('NEXT_PUBLIC_SUPABASE_URL ausente ou inválida'),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY ausente'),
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY ausente'),
  ),
  SUPABASE_JWT_SECRET: optionalString,
  APP_ENCRYPTION_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(32, 'APP_ENCRYPTION_KEY deve ter 32+ caracteres').optional(),
  ),
  CRON_SECRET: optionalString,
  WEBHOOK_INTERNAL_SECRET: optionalString,

  /* E-mail transacional — Resend. Opcional: sem a chave, e-mails são apenas ignorados. */
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,
  /* Destinatários da notificação de novo pedido (separe por vírgula). */
  ORDER_NOTIFICATION_EMAILS: optionalString,

  /* Pagamentos — Stripe (cartão). Opcionais: exigidos apenas quando o cartão é usado. */
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,

  /* Pagamentos — Cora (Pix via mTLS). Opcionais: exigidos apenas quando o Pix é usado. */
  CORA_ENV: z.preprocess(emptyToUndefined, z.enum(['stage', 'production']).optional()),
  CORA_CLIENT_ID: optionalString,
  CORA_CERT_BASE64: optionalString,
  CORA_KEY_BASE64: optionalString,
})

/** True quando as credenciais do Stripe (cartão) estão presentes no ambiente. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

/** True quando as credenciais da Cora (Pix) estão completas no ambiente. */
export function isCoraConfigured(): boolean {
  return Boolean(
    process.env.CORA_CLIENT_ID && process.env.CORA_CERT_BASE64 && process.env.CORA_KEY_BASE64,
  )
}

/** True quando o Resend (e-mail transacional) está configurado. */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

/** Remetente padrão dos e-mails (fallback seguro se a env não estiver setada). */
export function resendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'Kickoffstore <no-reply@kickoffstore.local>'
}

/** Lista de e-mails que recebem a notificação de novo pedido (equipe/loja). */
export function orderNotificationEmails(): string[] {
  return (process.env.ORDER_NOTIFICATION_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export type ServerEnv = z.infer<typeof serverSchema>

let cachedServerEnv: ServerEnv | null = null

/**
 * Validate and return required server env. Throws a helpful error listing the
 * missing variables. Call this only from server code (never in the browser).
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv
  const parsed = serverSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(
      `Variáveis de ambiente do servidor inválidas ou ausentes:\n${issues}\n` +
        'Preencha o arquivo .env.local com base em .env.example.',
    )
  }
  cachedServerEnv = parsed.data
  return cachedServerEnv
}

/** True when Supabase public config is present (used to gate UI/data calls). */
export function isSupabaseConfigured(): boolean {
  return Boolean(clientEnv.NEXT_PUBLIC_SUPABASE_URL && clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
