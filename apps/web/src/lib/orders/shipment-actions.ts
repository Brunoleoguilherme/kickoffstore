'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMelhorEnvioConfigured, buyLabel } from '@kickoffstore/integrations'

export interface ShipmentActionState {
  ok?: boolean
  error?: string
}

export interface BuyLabelState {
  ok?: boolean
  error?: string
  labelUrl?: string
  trackingCode?: string
}

/**
 * Salva/atualiza o código de rastreio (e transportadora) de um pedido na
 * tabela `shipments`. Funciona já com digitação manual do código — quando o
 * Melhor Envio for integrado, o mesmo registro passa a ser preenchido pela API.
 */
export async function setTrackingAction(
  _prev: ShipmentActionState,
  formData: FormData,
): Promise<ShipmentActionState> {
  try {
    await requirePermission('orders.manage')

    const orderId = String(formData.get('orderId') ?? '').trim()
    const carrier = String(formData.get('carrier') ?? '').trim() || 'Correios'
    const trackingCode = String(formData.get('trackingCode') ?? '').trim()
    if (!orderId) return { error: 'Pedido inválido.' }
    if (!trackingCode) return { error: 'Informe o código de rastreio.' }

    const admin = createAdminClient()

    const { data: od } = await admin
      .from('orders')
      .select('organization_id')
      .eq('id', orderId)
      .maybeSingle()
    const organizationId = (od as { organization_id: string } | null)?.organization_id
    if (!organizationId) return { error: 'Pedido não encontrado.' }

    // Depósito padrão (warehouse_id é obrigatório em shipments).
    const { data: wh } = await admin
      .from('warehouses')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const warehouseId = (wh as { id: string } | null)?.id
    if (!warehouseId) return { error: 'Nenhum depósito ativo cadastrado.' }

    // Já existe um envio para este pedido?
    const { data: existing } = await admin
      .from('shipments')
      .select('id')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const shipmentId = (existing as { id: string } | null)?.id

    const now = new Date().toISOString()

    if (shipmentId) {
      const { error } = await admin
        .from('shipments')
        .update({
          provider: carrier,
          service_name: carrier,
          tracking_code: trackingCode,
          status: 'in_transit',
          updated_at: now,
        })
        .eq('id', shipmentId)
      if (error) return { error: 'Falha ao atualizar o rastreio.' }
    } else {
      const { error } = await admin.from('shipments').insert({
        organization_id: organizationId,
        order_id: orderId,
        warehouse_id: warehouseId,
        provider: carrier,
        service_name: carrier,
        tracking_code: trackingCode,
        status: 'in_transit',
        shipped_at: now,
      })
      if (error) return { error: 'Falha ao registrar o rastreio.' }
    }

    revalidatePath(`/admin/pedidos/${orderId}`)
    return { ok: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao salvar rastreio.' }
  }
}

/**
 * Compra o frete e gera a etiqueta no Melhor Envio para um pedido pago.
 * ATENÇÃO: debita o saldo da conta Melhor Envio. Só roda por clique do admin.
 * Usa o serviço que o cliente escolheu no checkout (shipping_method_snapshot).
 */
export async function buyLabelAction(
  _prev: BuyLabelState,
  formData: FormData,
): Promise<BuyLabelState> {
  try {
    await requirePermission('orders.manage')
    if (!isMelhorEnvioConfigured()) {
      return { error: 'Melhor Envio não configurado no ambiente.' }
    }
    const orderId = String(formData.get('orderId') ?? '').trim()
    if (!orderId) return { error: 'Pedido inválido.' }

    const admin = createAdminClient()
    const { data: od } = await admin
      .from('orders')
      .select(
        'organization_id, paid_at, shipping_cents, shipping_address, customer_snapshot, shipping_method_snapshot',
      )
      .eq('id', orderId)
      .maybeSingle()
    const order = od as unknown as {
      organization_id: string
      paid_at: string | null
      shipping_cents: number | null
      shipping_address: {
        zip?: string
        street?: string
        number?: string
        complement?: string | null
        district?: string | null
        city?: string
        state?: string
      } | null
      customer_snapshot: { name?: string; email?: string; document?: string; phone?: string } | null
      shipping_method_snapshot: { serviceId?: number; name?: string } | null
    } | null

    if (!order) return { error: 'Pedido não encontrado.' }
    if (!order.paid_at) return { error: 'Gere a etiqueta apenas para pedidos pagos.' }
    const serviceId = order.shipping_method_snapshot?.serviceId
    if (!serviceId) {
      return { error: 'Este pedido não tem serviço de frete do Melhor Envio escolhido no checkout.' }
    }

    // Depósito padrão (warehouse_id é obrigatório em shipments).
    const { data: wh } = await admin
      .from('warehouses')
      .select('id')
      .eq('organization_id', order.organization_id)
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const warehouseId = (wh as { id: string } | null)?.id
    if (!warehouseId) return { error: 'Nenhum depósito ativo cadastrado.' }

    // Itens + dimensões das variações.
    const { data: itemsData } = await admin
      .from('order_items')
      .select('product_name, quantity, unit_price_cents, variant_id')
      .eq('order_id', orderId)
    const items = (itemsData ?? []) as unknown as Array<{
      product_name: string
      quantity: number
      unit_price_cents: number
      variant_id: string | null
    }>
    if (items.length === 0) return { error: 'Pedido sem itens.' }

    const variantIds = items.map((i) => i.variant_id).filter((v): v is string => Boolean(v))
    const dimsById = new Map<
      string,
      { weight_grams: number | null; width_cm: number | null; height_cm: number | null; length_cm: number | null }
    >()
    if (variantIds.length > 0) {
      const { data: vd } = await admin
        .from('product_variants')
        .select('id, weight_grams, width_cm, height_cm, length_cm')
        .in('id', variantIds)
      for (const v of (vd ?? []) as unknown as Array<{
        id: string
        weight_grams: number | null
        width_cm: number | null
        height_cm: number | null
        length_cm: number | null
      }>) {
        dimsById.set(v.id, v)
      }
    }

    const products = items.map((i) => ({
      name: i.product_name,
      quantity: i.quantity,
      unitaryValue: Number(i.unit_price_cents ?? 0) / 100,
    }))

    const volumes: Array<{ height: number; width: number; length: number; weight: number }> = []
    let insurance = 0
    for (const i of items) {
      const d = i.variant_id ? dimsById.get(i.variant_id) : undefined
      insurance += (Number(i.unit_price_cents ?? 0) / 100) * i.quantity
      for (let k = 0; k < i.quantity; k++) {
        volumes.push({
          height: Number(d?.height_cm ?? 0),
          width: Number(d?.width_cm ?? 0),
          length: Number(d?.length_cm ?? 0),
          weight: Number(d?.weight_grams ?? 0) / 1000,
        })
      }
    }

    const addr = order.shipping_address ?? {}
    const cust = order.customer_snapshot ?? {}
    const result = await buyLabel({
      serviceId,
      recipient: {
        name: cust.name ?? '',
        email: cust.email ?? '',
        phone: cust.phone,
        document: cust.document ?? '',
        address: addr.street ?? '',
        number: addr.number ?? 's/n',
        complement: addr.complement ?? undefined,
        district: addr.district ?? undefined,
        city: addr.city ?? '',
        stateAbbr: addr.state ?? '',
        postalCode: addr.zip ?? '',
      },
      products,
      volumes,
      insuranceValue: insurance,
    })

    const now = new Date().toISOString()
    const { data: existing } = await admin
      .from('shipments')
      .select('id')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const shipmentId = (existing as { id: string } | null)?.id

    const payload = {
      provider: 'melhor_envio',
      service_code: String(serviceId),
      service_name: order.shipping_method_snapshot?.name ?? 'Melhor Envio',
      external_id: result.melhorEnvioId,
      tracking_code: result.trackingCode || null,
      label_storage_path: result.labelUrl || null,
      charged_to_customer_cents: Number(order.shipping_cents ?? 0),
      status: 'label_printed',
      updated_at: now,
    }

    if (shipmentId) {
      const { error } = await admin.from('shipments').update(payload).eq('id', shipmentId)
      if (error) return { error: 'Etiqueta gerada, mas falhou ao salvar no pedido.' }
    } else {
      const { error } = await admin.from('shipments').insert({
        organization_id: order.organization_id,
        order_id: orderId,
        warehouse_id: warehouseId,
        ...payload,
      })
      if (error) return { error: 'Etiqueta gerada, mas falhou ao registrar no pedido.' }
    }

    revalidatePath(`/admin/pedidos/${orderId}`)
    return { ok: true, labelUrl: result.labelUrl, trackingCode: result.trackingCode }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Falha ao gerar a etiqueta.' }
  }
}
