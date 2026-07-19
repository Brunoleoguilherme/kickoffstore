import { z } from 'zod'

/** Brazilian postal code (CEP), digits only or formatted. */
export const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(z.string().length(8, 'CEP deve ter 8 dígitos'))

/** CPF/CNPJ digits only. Full validity check happens with fiscal integration. */
export const taxIdSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(z.string().min(11).max(14))

/** Money in integer cents; never floats (CLAUDE.md rule 9). */
export const centsSchema = z
  .number()
  .int('Valor deve ser inteiro em centavos')
  .nonnegative('Valor não pode ser negativo')

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido (use minúsculas, números e hífens)')

export const emailSchema = z.string().email('E-mail inválido').max(320)

export const skuSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9._-]+$/, 'SKU inválido')

export const eanSchema = z
  .string()
  .regex(/^\d{8}$|^\d{12,14}$/, 'EAN/GTIN inválido')
