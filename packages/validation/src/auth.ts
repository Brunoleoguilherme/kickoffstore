import { z } from 'zod'
import { emailSchema } from './primitives'

const strongPassword = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres')
  .max(72, 'A senha é muito longa')
  .regex(/[a-z]/, 'Inclua uma letra minúscula')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
  .regex(/[0-9]/, 'Inclua um número')

export const signUpSchema = z.object({
  fullName: z.string().min(2, 'Informe seu nome').max(160),
  email: emailSchema,
  password: strongPassword,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'É necessário aceitar os termos' }) }),
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
})

export const requestPasswordResetSchema = z.object({ email: emailSchema })

export const updatePasswordSchema = z.object({ password: strongPassword })

export const staffInviteSchema = z.object({
  email: emailSchema,
  fullName: z.string().min(2).max(160),
  roleCode: z.string().min(1),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type StaffInviteInput = z.infer<typeof staffInviteSchema>
