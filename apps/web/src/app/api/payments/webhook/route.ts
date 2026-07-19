import { NextResponse } from 'next/server'
import { constructWebhookEvent, type StripeCheckoutSession } from '@kickoffstore/integrations'
import { confirmPaymentByExternalId } from '@/lib/payments/orders'

// Precisamos do corpo bruto + crypto → runtime Node.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Webhook da Stripe (cartão). Verifica assinatura e confirma o pagamento.
export async function POST(req: Request) {
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event
  try {
    event = constructWebhookEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'assinatura inválida'
    console.error('stripe webhook signature error', message)
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }

  try {
    switch (event.type) {
      // Cartão: pagamento conclui na hora
      case 'checkout.session.completed': {
        const session = event.data.object as unknown as StripeCheckoutSession
        if (session.payment_status === 'paid') {
          await confirmPaymentByExternalId('stripe', session.id, session.amount_total ?? 0)
        }
        break
      }
      // Pix via Stripe (caso habilitado): confirmação assíncrona
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as unknown as StripeCheckoutSession
        await confirmPaymentByExternalId('stripe', session.id, session.amount_total ?? 0)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('stripe webhook handler error', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
