'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, CreditCard, Loader2, QrCode } from 'lucide-react'
import { formatBRL } from '@clubedaestampa/ui'
import { AnnouncementBar } from '@/components/home/announcement-bar'
import { SiteHeader } from '@/components/home/site-header'
import { SiteFooter } from '@/components/home/site-footer'
import { useCart } from '@/components/cart/cart-context'
import { createOrderFromCart } from '@/lib/checkout/actions'
import { quoteShippingAction, shippingEnabledAction } from '@/lib/checkout/shipping-actions'
import { applyCouponAction } from '@/lib/checkout/coupon-actions'
import type { ShippingQuote } from '@clubedaestampa/integrations'
import { trackBeginCheckout } from '@/lib/analytics/events'

type Method = 'pix' | 'card'

interface PixResult {
  invoiceId: string
  emv: string
  qrcodeUrl: string
  amount: number
}

const inputClass =
  'h-12 w-full rounded-lg border border-white/15 bg-night-800 px-3 text-base text-white placeholder-night-400 outline-none transition-colors focus:border-brand-500 sm:h-11 sm:text-sm'
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-night-300'

export default function CheckoutPage() {
  const { items, subtotalCents, hydrated, clear } = useCart()

  const [method, setMethod] = useState<Method>('pix')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pix, setPix] = useState<PixResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Evento begin_checkout / InitiateCheckout — dispara uma vez, com o carrinho pronto.
  const beginFired = useRef(false)
  useEffect(() => {
    if (hydrated && items.length > 0 && !beginFired.current) {
      beginFired.current = true
      trackBeginCheckout({ valueCents: subtotalCents })
    }
  }, [hydrated, items.length, subtotalCents])

  // Pagador + endereço
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [doc, setDoc] = useState('')
  const [zip, setZip] = useState('')
  const [street, setStreet] = useState('')
  const [num, setNum] = useState('')
  const [complement, setComplement] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')

  // Frete (Melhor Envio) — só aparece quando a loja conectou a conta.
  const [shipEnabled, setShipEnabled] = useState(false)
  const [shipQuotes, setShipQuotes] = useState<ShippingQuote[] | null>(null)
  const [shipSel, setShipSel] = useState<ShippingQuote | null>(null)
  const [shipLoading, setShipLoading] = useState(false)
  const [shipError, setShipError] = useState<string | null>(null)

  // Cupom de desconto
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; discountCents: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  useEffect(() => {
    shippingEnabledAction()
      .then(setShipEnabled)
      .catch(() => setShipEnabled(false))
  }, [])

  // Se o carrinho ou o CEP mudam, a cotação anterior deixa de valer.
  const itemsKey = items.map((l) => `${l.variantId}:${l.quantity}`).join(',')
  useEffect(() => {
    setShipQuotes(null)
    setShipSel(null)
    setShipError(null)
  }, [zip, itemsKey])

  // Se o carrinho muda, o cupom aplicado deixa de valer (base de cálculo mudou).
  useEffect(() => {
    setCoupon(null)
    setCouponError(null)
  }, [itemsKey])

  const shippingCents = shipSel?.priceCents ?? 0
  const discountCents = coupon?.discountCents ?? 0
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents

  async function aplicarCupom() {
    setCouponError(null)
    setCouponLoading(true)
    try {
      const r = await applyCouponAction(couponInput, subtotalCents)
      if (!r.ok) {
        setCoupon(null)
        setCouponError(r.message ?? 'Cupom inválido.')
        return
      }
      setCoupon({ code: r.code ?? couponInput.toUpperCase(), discountCents: r.discountCents ?? 0 })
    } catch {
      setCouponError('Falha ao validar o cupom.')
    } finally {
      setCouponLoading(false)
    }
  }

  async function calcularFrete() {
    setShipError(null)
    setShipSel(null)
    setShipQuotes(null)
    setShipLoading(true)
    try {
      const r = await quoteShippingAction(
        zip,
        items.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      )
      if (!r.configured) {
        setShipEnabled(false)
        return
      }
      if (!r.ok || !r.quotes || r.quotes.length === 0) {
        setShipError(r.message ?? 'Não foi possível calcular o frete.')
        return
      }
      setShipQuotes(r.quotes)
      setShipSel(r.quotes[0] ?? null)
    } catch {
      setShipError('Falha ao calcular o frete. Tente novamente.')
    } finally {
      setShipLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    // Se o frete está habilitado, exige uma cotação escolhida (a menos que a
    // cotação tenha falhado — nesse caso não travamos o cliente).
    if (shipEnabled && !shipSel && !shipError) {
      setError('Calcule o frete e escolha uma opção antes de finalizar.')
      return
    }
    setLoading(true)
    try {
      const created = await createOrderFromCart(
        items.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        { name, email, document: doc },
        { zip, street, number: num, complement, district, city, state: uf },
        shipSel
          ? {
              cents: shipSel.priceCents,
              snapshot: {
                serviceId: shipSel.serviceId,
                name: shipSel.name,
                company: shipSel.company,
                deliveryDays: shipSel.deliveryDays,
              },
            }
          : undefined,
        coupon?.code,
      )
      if (!created.ok || !created.orderId) {
        setError(created.message ?? 'Não foi possível criar o pedido.')
        setLoading(false)
        return
      }
      const orderId = created.orderId

      if (method === 'card') {
        const res = await fetch('/api/payments/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, name, email }),
        })
        const data = (await res.json()) as { ok?: boolean; url?: string; message?: string }
        if (res.ok && data.ok && data.url) {
          clear()
          window.location.href = data.url
          return
        }
        clear()
        setInfo(
          data.message ??
            `Pedido ${orderId.slice(0, 8)} criado. O pagamento por cartão será ativado assim que as credenciais da Stripe forem cadastradas.`,
        )
        setLoading(false)
        return
      }

      // Pix
      const res = await fetch('/api/payments/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, document: doc, name, email }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        invoice_id?: string
        emv?: string
        qrcode_url?: string
        amount?: number
        message?: string
      }
      if (res.ok && data.ok) {
        clear()
        setPix({
          invoiceId: data.invoice_id ?? '',
          emv: data.emv ?? '',
          qrcodeUrl: data.qrcode_url ?? '',
          amount: data.amount ?? subtotalCents,
        })
        setLoading(false)
        return
      }
      clear()
      setInfo(
        data.message ??
          `Pedido ${orderId.slice(0, 8)} criado. O Pix será ativado assim que as credenciais da Cora forem cadastradas.`,
      )
      setLoading(false)
    } catch {
      setError('Erro inesperado ao processar o checkout.')
      setLoading(false)
    }
  }

  function copyEmv() {
    if (!pix?.emv) return
    navigator.clipboard?.writeText(pix.emv).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  const empty = hydrated && items.length === 0 && !pix && !info

  return (
    <div className="min-h-dvh overflow-x-hidden bg-night-900 text-white">
      <AnnouncementBar />
      <SiteHeader />

      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-28 sm:px-8">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
          Finalizar compra
        </h1>

        {/* Resultado Pix */}
        {pix && (
          <div className="mt-10 rounded-2xl border border-brand-500/30 bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-2 text-brand-400">
              <QrCode className="h-5 w-5" aria-hidden />
              <h2 className="font-display text-xl font-bold uppercase">Pague com Pix</h2>
            </div>
            <p className="mt-2 text-night-300">
              Valor: <span className="font-semibold text-white">{formatBRL(pix.amount)}</span>
            </p>
            {pix.qrcodeUrl && (
              <div className="mt-5 inline-block rounded-xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pix.qrcodeUrl} alt="QR Code Pix" className="h-52 w-52" />
              </div>
            )}
            {pix.emv && (
              <div className="mt-5">
                <span className={labelClass}>Pix copia e cola</span>
                <div className="flex gap-2">
                  <input readOnly value={pix.emv} className={`${inputClass} font-mono`} />
                  <button
                    type="button"
                    onClick={copyEmv}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-night-900 transition-colors hover:bg-brand-400"
                  >
                    {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
            <p className="mt-6 text-sm text-night-300">
              Assim que o pagamento for confirmado, o pedido é atualizado automaticamente. Você pode
              acompanhar em{' '}
              <Link href="/conta/pedidos" className="text-brand-400 hover:underline">
                Meus pedidos
              </Link>
              .
            </p>
          </div>
        )}

        {/* Mensagem informativa (ex.: credenciais ainda não cadastradas) */}
        {info && !pix && (
          <div className="mt-10 rounded-2xl border border-white/15 bg-surface p-6">
            <h2 className="font-display text-lg font-bold">Pedido registrado</h2>
            <p className="mt-2 text-night-200">{info}</p>
            <Link
              href="/produtos"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-semibold uppercase tracking-wide text-night-900 transition-colors hover:bg-brand-400"
            >
              Voltar à loja
            </Link>
          </div>
        )}

        {empty && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-surface p-8 text-center">
            <p className="text-night-300">Seu carrinho está vazio.</p>
            <Link
              href="/produtos"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-semibold uppercase tracking-wide text-night-900 transition-colors hover:bg-brand-400"
            >
              Explorar a loja
            </Link>
          </div>
        )}

        {/* Formulário */}
        {!pix && !info && !empty && (
          <form onSubmit={handleSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              {/* dados do pagador */}
              <section className="rounded-2xl border border-white/10 bg-surface p-6">
                <h2 className="font-display text-lg font-bold uppercase tracking-wide">Seus dados</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="name">Nome completo</label>
                    <input id="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="email">E-mail</label>
                    <input id="email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="doc">CPF ou CNPJ</label>
                    <input id="doc" required inputMode="numeric" value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Somente números" className={inputClass} />
                  </div>
                </div>
              </section>

              {/* endereço */}
              <section className="rounded-2xl border border-white/10 bg-surface p-6">
                <h2 className="font-display text-lg font-bold uppercase tracking-wide">Entrega</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="zip">CEP</label>
                    <input id="zip" required inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={zip} onChange={(e) => setZip(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-4">
                    <label className={labelClass} htmlFor="street">Rua</label>
                    <input id="street" required value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="num">Número</label>
                    <input id="num" inputMode="numeric" autoComplete="off" value={num} onChange={(e) => setNum(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-4">
                    <label className={labelClass} htmlFor="complement">Complemento</label>
                    <input id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-3">
                    <label className={labelClass} htmlFor="district">Bairro</label>
                    <input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="city">Cidade</label>
                    <input id="city" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelClass} htmlFor="uf">UF</label>
                    <input id="uf" required maxLength={2} value={uf} onChange={(e) => setUf(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </section>

              {/* frete */}
              {shipEnabled && (
                <section className="rounded-2xl border border-white/10 bg-surface p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-display text-lg font-bold uppercase tracking-wide">Frete</h2>
                    <button
                      type="button"
                      onClick={calcularFrete}
                      disabled={shipLoading}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-500/50 px-4 text-sm font-semibold text-brand-300 transition-colors hover:bg-brand-500/10 disabled:opacity-60"
                    >
                      {shipLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                      {shipLoading ? 'Calculando…' : 'Calcular frete'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-night-400">
                    Preencha o CEP acima e clique em calcular para ver as opções de entrega.
                  </p>

                  {shipError && <p className="mt-3 text-sm text-danger">{shipError}</p>}

                  {shipQuotes && shipQuotes.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {shipQuotes.map((q) => {
                        const selected = shipSel?.serviceId === q.serviceId
                        return (
                          <button
                            key={q.serviceId}
                            type="button"
                            onClick={() => setShipSel(q)}
                            className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                              selected ? 'border-brand-500 bg-brand-500/10' : 'border-white/15 hover:border-white/40'
                            }`}
                          >
                            <span>
                              <span className="block text-sm font-semibold">
                                {q.company} {q.name}
                              </span>
                              <span className="block text-xs text-night-300">
                                {q.deliveryDays > 0
                                  ? `Prazo estimado: ${q.deliveryDays} dia(s) útil(eis)`
                                  : 'Prazo a confirmar'}
                              </span>
                            </span>
                            <span className="shrink-0 font-semibold text-white">{formatBRL(q.priceCents)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* forma de pagamento */}
              <section className="rounded-2xl border border-white/10 bg-surface p-6">
                <h2 className="font-display text-lg font-bold uppercase tracking-wide">Pagamento</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMethod('pix')}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                      method === 'pix' ? 'border-brand-500 bg-brand-500/10' : 'border-white/15 hover:border-white/40'
                    }`}
                  >
                    <QrCode className="h-6 w-6 text-brand-400" aria-hidden />
                    <span>
                      <span className="block font-semibold">Pix</span>
                      <span className="block text-xs text-night-300">Aprovação na hora</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('card')}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                      method === 'card' ? 'border-brand-500 bg-brand-500/10' : 'border-white/15 hover:border-white/40'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 text-brand-400" aria-hidden />
                    <span>
                      <span className="block font-semibold">Cartão de crédito</span>
                      <span className="block text-xs text-night-300">Parcele em até 10x</span>
                    </span>
                  </button>
                </div>
              </section>

              {error && <p className="text-sm text-danger">{error}</p>}
            </div>

            {/* resumo + submit */}
            <aside className="h-fit rounded-2xl border border-white/10 bg-surface p-6">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">Resumo</h2>
              <ul className="mt-4 space-y-3">
                {items.map((l) => (
                  <li key={l.variantId} className="flex justify-between gap-3 text-sm">
                    <span className="text-night-200">
                      {l.quantity}× {l.name}
                      {l.variantLabel ? ` (${l.variantLabel})` : ''}
                    </span>
                    <span className="shrink-0 font-semibold text-white">
                      {formatBRL(l.unitPriceCents * l.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              {/* Cupom */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <span className={labelClass}>Cupom de desconto</span>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Ex.: BEMVINDO10"
                    className={`${inputClass} uppercase`}
                  />
                  <button
                    type="button"
                    onClick={aplicarCupom}
                    disabled={couponLoading || !couponInput.trim()}
                    className="inline-flex h-12 shrink-0 items-center rounded-lg border border-brand-500/50 px-4 text-sm font-semibold text-brand-300 transition-colors hover:bg-brand-500/10 disabled:opacity-60 sm:h-11"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p className="mt-2 text-sm text-danger">{couponError}</p>}
                {coupon && (
                  <p className="mt-2 text-sm text-success">
                    Cupom {coupon.code} aplicado (−{formatBRL(coupon.discountCents)}).{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setCoupon(null)
                        setCouponInput('')
                      }}
                      className="underline"
                    >
                      remover
                    </button>
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between text-night-200">
                  <span>Subtotal</span>
                  <span>{formatBRL(subtotalCents)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-success">
                    <span>Desconto ({coupon.code})</span>
                    <span>−{formatBRL(discountCents)}</span>
                  </div>
                )}
                {shipEnabled && (
                  <div className="flex justify-between text-night-200">
                    <span>Frete{shipSel ? ` · ${shipSel.company}` : ''}</span>
                    <span>{shipSel ? formatBRL(shippingCents) : 'a calcular'}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
                <span className="text-sm uppercase tracking-wide text-night-300">Total</span>
                <span className="text-2xl font-bold text-brand-500">{formatBRL(totalCents)}</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-semibold uppercase tracking-wide text-night-900 transition-all hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-gold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {loading ? 'Processando…' : method === 'pix' ? 'Gerar Pix' : 'Pagar com cartão'}
              </button>
              <Link
                href="/carrinho"
                className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-white/15 text-sm font-semibold uppercase tracking-wide text-night-200 transition-colors hover:border-white/40"
              >
                Voltar ao carrinho
              </Link>
            </aside>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
