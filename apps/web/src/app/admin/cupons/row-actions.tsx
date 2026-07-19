'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setCouponActiveAction, deleteCouponAction } from '@/lib/coupons/coupon-admin-actions'

export function CouponRowActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setCouponActiveAction(id, !active))}
        className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
      >
        {active ? 'Desativar' : 'Ativar'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => deleteCouponAction(id))}
        className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
      >
        Excluir
      </button>
    </div>
  )
}
