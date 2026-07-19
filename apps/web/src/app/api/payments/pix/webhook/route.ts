import { NextResponse } from 'next/server'
import { getInvoice } from '@kickoffstore/integrations'
import { confirmPaymentByExternalId } from '@/lib/payments/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Webhook da Cora (Pix). A Cora envia o evento nos HEADERS (corpo vazio):
//   webhook-event-type: "invoice.paid" | webhook-resource-id: "inv_..."
// Não confiamos só no header: confirmamos consultando a invoice na API.
export async function POST(req: Request) {
  const eventType = req.headers.get('webhook-event-type') ?? ''
  const resourceId = req.headers.get('webhook-resource-id') ?? ''
  if (!eventType.includes('paid') || !resourceId) {
    return NextResponse.json({ success: true })
  }

  try {
    const invoice = await getInvoice(resourceId)
    const status = invoice?.status as string | undefined
    const totalPaid = invoice?.total_paid as number | undefined
    const totalAmount = invoice?.total_amount as number | undefined
    const isPaid =
      status === 'PAID' ||
      (typeof totalPaid === 'number' &&
        typeof totalAmount === 'number' &&
        totalAmount > 0 &&
        totalPaid >= totalAmount)
    if (!isPaid) return NextResponse.json({ success: true })

    await confirmPaymentByExternalId('cora', resourceId, totalPaid ?? totalAmount ?? 0)
  } catch (err) {
    console.error('cora webhook error', err)
    // Responde 200 mesmo em erro para a Cora não reenviar em loop; o pagamento
    // pode ser reconciliado depois consultando a invoice.
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ success: true })
}
