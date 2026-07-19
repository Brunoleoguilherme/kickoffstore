/** Format integer cents as Brazilian Real. Money is always cents (CLAUDE.md). */
export function formatBRL(cents: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

/** Compute an installment label, e.g. "12x de R$ 41,58 sem juros". */
export function formatInstallments(totalCents: number, installments: number): string {
  const per = Math.round(totalCents / installments)
  return `${installments}x de ${formatBRL(per)} sem juros`
}

/** Percentage discount between two cent values, rounded to an integer. */
export function discountPercent(priceCents: number, compareAtCents: number): number {
  if (compareAtCents <= 0 || priceCents >= compareAtCents) return 0
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100)
}
