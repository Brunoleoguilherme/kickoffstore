import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createCardPaymentProvider } from '@kickoffstore/integrations'
import { isStripeConfigured } from '@kickoffstore/validation'
import { loadPayableOrder, resolvePayer, recordPayment } from '@/lib/payments/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cartão de crédito via Stripe Checkout hospedado (cópia do fluxo BFWC).
// Contrato: retorna { ok, url } e o front redireciona para a URL da Stripe.
export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          code: 'CARD_SOON',
          message: 'Pagamento por cartão estará disponível em breve. Por enquanto, use o Pix.',
        },
        { status: 503 },
      )
    }

    const body = (await req.json()) as {
      order_id?: string
      name?: string
      email?: string
    }
    const orderId = body.order_id
    if (!orderId) {
      return NextResponse.json({ ok: false, message: 'order_id obrigatório.' }, { status: 400 })
    }

    const order = await loadPayableOrder(orderId)
    if (!order) {
      return NextResponse.json({ ok: false, message: 'Pedido não encontrado.' }, { status: 404 })
    }
    if (order.status === 'paid') {
      return NextResponse.json({ ok: false, message: 'Pedido já está pago.' }, { status: 409 })
    }
    if (order.total_cents <= 0) {
      return NextResponse.json({ ok: false, message: 'Pedido sem valor a cobrar.' }, { status: 409 })
    }

    const payer = resolvePayer(order, { name: body.name, email: body.email })
    const idempotencyKey = `card:${order.id}`

    const provider = createCardPaymentProvider()
    const result = await provider.createCheckout({
      orderId: order.id,
      amountCents: order.total_cents,
      currency: order.currency as 'BRL',
      method: 'credit_card',
      idempotencyKey,
      payer,
      description: `Pedido Kickoffstore #${order.id.slice(0, 8)}`,
    })

    await recordPayment({
      order,
      provider: 'stripe',
      method: 'credit_card',
      amountCents: order.total_cents,
      externalId: result.externalId,
      idempotencyKey,
      providerMetadata: { checkout_session: result.externalId, request_id: randomUUID() },
    })

    if (!result.redirectUrl) {
      throw new Error('Stripe não retornou a URL de pagamento.')
    }
    return NextResponse.json({
      ok: true,
      url: result.redirectUrl,
      id: result.externalId,
      amount: order.total_cents,
    })
  } catch (err) {
    console.error('create-checkout error', err)
    const message = err instanceof Error ? err.message : 'Erro ao criar pagamento.'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
