import { NextResponse } from 'next/server'
import { createPixPaymentProvider } from '@clubedaestampa/integrations'
import { isCoraConfigured } from '@clubedaestampa/validation'
import { loadPayableOrder, resolvePayer, recordPayment } from '@/lib/payments/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Pix via Cora (Integração Direta, mTLS) — cópia do fluxo BFWC.
// Retorna o EMV (copia-e-cola) e a URL do QR Code.
export async function POST(req: Request) {
  try {
    if (!isCoraConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          code: 'PIX_SOON',
          message: 'Pagamento por Pix estará disponível em breve.',
        },
        { status: 503 },
      )
    }

    const body = (await req.json()) as {
      order_id?: string
      document?: string
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

    const payer = resolvePayer(order, {
      name: body.name,
      email: body.email,
      document: body.document,
    })
    if (!payer.taxId) {
      return NextResponse.json(
        {
          ok: false,
          code: 'NEED_DOCUMENT',
          message: 'Informe um CPF ou CNPJ válido para gerar o Pix.',
        },
        { status: 422 },
      )
    }

    const idempotencyKey = `pix:${order.id}`
    const provider = createPixPaymentProvider()
    const result = await provider.createCheckout({
      orderId: order.id,
      amountCents: order.total_cents,
      currency: order.currency as 'BRL',
      method: 'pix',
      idempotencyKey,
      payer,
      description: `Pedido Clube da Estampa #${order.id.slice(0, 8)}`,
    })

    await recordPayment({
      order,
      provider: 'cora',
      method: 'pix',
      amountCents: order.total_cents,
      externalId: result.externalId,
      idempotencyKey,
      providerMetadata: { invoice_id: result.externalId },
    })

    return NextResponse.json({
      ok: true,
      invoice_id: result.externalId,
      emv: result.pixQrCode ?? '',
      qrcode_url: result.redirectUrl ?? '',
      amount: order.total_cents,
    })
  } catch (err) {
    console.error('pix/create error', err)
    const message = err instanceof Error ? err.message : 'Erro ao gerar o Pix.'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
