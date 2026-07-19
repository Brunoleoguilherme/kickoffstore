'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  signInSchema,
  signUpSchema,
  requestPasswordResetSchema,
  updatePasswordSchema,
  clientEnv,
} from '@kickoffstore/validation'
import { createClient } from '@/lib/supabase/server'

export interface ActionState {
  error?: string
  success?: string
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: 'E-mail ou senha inválidos.' }

  revalidatePath('/', 'layout')
  redirect('/conta')
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    acceptTerms: formData.get('acceptTerms') === 'on',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  })
  if (error) return { error: 'Não foi possível criar a conta. Tente outro e-mail.' }

  return { success: 'Conta criada. Verifique seu e-mail para confirmar o cadastro.' }
}

export async function signOutAction(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/entrar')
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: 'E-mail inválido.' }

  const supabase = createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/redefinir-senha`,
  })
  // Always return success to avoid leaking which e-mails exist.
  return { success: 'Se o e-mail existir, enviaremos as instruções de recuperação.' }
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Senha inválida' }

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: 'Não foi possível atualizar a senha. O link pode ter expirado.' }

  return { success: 'Senha atualizada com sucesso. Você já pode entrar.' }
}
