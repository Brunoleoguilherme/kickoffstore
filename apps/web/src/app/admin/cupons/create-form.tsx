'use client'

import { useFormState } from 'react-dom'
import { createCouponAction } from '@/lib/coupons/coupon-admin-actions'
import type { ActionState } from '@/lib/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SubmitButton } from '@/components/auth/submit-button'

const initial: ActionState = {}

export interface PartnerOpt {
  id: string
  name: string
}

const selectCls =
  'flex h-11 w-full rounded-md border border-night-100 bg-white px-3 text-sm outline-none focus-visible:border-brand-500'

export function CouponCreateForm({ partners }: { partners: PartnerOpt[] }) {
  const [state, formAction] = useFormState(createCouponAction, initial)
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Código</Label>
          <Input id="code" name="code" placeholder="BEMVINDO10" required className="uppercase" />
        </div>
        <div>
          <Label htmlFor="discountType">Tipo</Label>
          <select id="discountType" name="discountType" className={selectCls} defaultValue="percent">
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="discountValue">Valor (% ou R$)</Label>
          <Input id="discountValue" name="discountValue" inputMode="decimal" placeholder="10" required />
        </div>
        <div>
          <Label htmlFor="minOrder">Pedido mínimo (R$)</Label>
          <Input id="minOrder" name="minOrder" inputMode="decimal" placeholder="0" />
        </div>
        <div>
          <Label htmlFor="maxUses">Máx. de usos</Label>
          <Input id="maxUses" name="maxUses" inputMode="numeric" placeholder="ilimitado" />
        </div>
        <div>
          <Label htmlFor="expiresAt">Expira em</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="partnerId">Loja</Label>
          <select id="partnerId" name="partnerId" className={selectCls} defaultValue="">
            <option value="">Todas as lojas</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                Só {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <SubmitButton>Criar cupom</SubmitButton>
    </form>
  )
}
