// ════════════════════════════════════════════════════════════════
//  Clube da Estampa — Cliente Resend (REST via fetch, sem SDK)
//  Zero dependências. Usado para e-mails transacionais (confirmação de pedido).
//
//  Variáveis de ambiente:
//    RESEND_API_KEY    = re_...
//    RESEND_FROM_EMAIL = "Clube da Estampa <pedidos@seudominio.com.br>"
// ════════════════════════════════════════════════════════════════
import type {
  EmailProvider,
  SendEmailInput as SendEmailContract,
  SendEmailResult,
  WebhookVerificationInput,
} from '@clubedaestampa/types'
import { IntegrationNotConfiguredError } from './errors'

const RESEND_API = 'https://api.resend.com'

export interface SendEmailArgs {
  to: string | string[]
  from: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/** Envia um e-mail via Resend. Lança erro se a API falhar ou a chave faltar. */
export async function sendEmail(input: SendEmailArgs): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY ausente no ambiente')

  const res = await fetch(`${RESEND_API}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  })
  const data = (await res.json()) as { id?: string; message?: string }
  if (!res.ok || !data.id) {
    throw new Error(data.message ?? `Resend API error (${res.status})`)
  }
  return { id: data.id }
}

/** Adaptador Resend por trás do contrato EmailProvider. */
export class ResendEmailProvider implements EmailProvider {
  constructor(config: { apiKey?: string }) {
    if (!config.apiKey) {
      throw new IntegrationNotConfiguredError('Resend', ['RESEND_API_KEY'])
    }
  }

  async send(input: SendEmailContract): Promise<SendEmailResult> {
    const { id } = await sendEmail({
      to: input.to,
      from: input.from,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    })
    return { externalId: id }
  }

  verifyWebhook(_input: WebhookVerificationInput): Promise<boolean> {
    return Promise.reject(new Error('Resend.verifyWebhook será implementado numa fase futura.'))
  }
}
