import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/session'
import { isInstagramConfigured, getInstagramProfile } from '@/lib/marketing/instagram'
import { ComposeForm } from './compose-form'

export const metadata: Metadata = { title: 'Instagram' }
export const dynamic = 'force-dynamic'

export default async function InstagramPage() {
  await requireUser()
  const configured = isInstagramConfigured()

  let profile: { username: string; followers: number; mediaCount: number } | null = null
  let profileError: string | null = null
  if (configured) {
    try {
      profile = await getInstagramProfile()
    } catch (err) {
      profileError = err instanceof Error ? err.message : 'Falha ao consultar o perfil.'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Instagram</h1>
        <p className="text-sm text-night-500">
          Publique posts direto do painel. Responder directs (DMs) chega na fase 2.
        </p>
      </div>

      {!configured ? (
        <div className="max-w-2xl space-y-4 rounded-xl border border-night-100 p-6 text-sm text-night-700">
          <p className="font-semibold text-night-900">Conta ainda não conectada</p>
          <p>
            Para ligar a publicação, precisamos de um <strong>app na Meta</strong> aprovado e de um{' '}
            <strong>token de acesso</strong> da sua conta profissional do Instagram. Passos:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Deixar o Instagram como conta <strong>Profissional</strong> (Comercial/Criador).</li>
            <li>Criar um app em <strong>developers.facebook.com</strong> com o produto Instagram.</li>
            <li>
              Pedir <strong>App Review</strong> das permissões de publicação (
              <code className="rounded bg-night-50 px-1">instagram_content_publish</code>).
            </li>
            <li>Gerar um <strong>token de longa duração</strong> e o <strong>IG User ID</strong> da conta.</li>
            <li>
              Definir na Vercel:{' '}
              <code className="rounded bg-night-50 px-1">INSTAGRAM_ACCESS_TOKEN</code> e{' '}
              <code className="rounded bg-night-50 px-1">INSTAGRAM_BUSINESS_ID</code>, e publicar.
            </li>
          </ol>
          <p className="text-night-500">
            Assim que essas variáveis existirem, esta tela passa a permitir publicar. As DMs entram
            depois (precisam de webhook + a permissão de mensagens aprovada, com a regra das 24h).
          </p>
        </div>
      ) : (
        <>
          {profile && (
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="rounded-lg border border-night-100 px-4 py-2">
                Conta: <strong>@{profile.username}</strong>
              </span>
              <span className="rounded-lg border border-night-100 px-4 py-2">
                Seguidores: <strong>{profile.followers.toLocaleString('pt-BR')}</strong>
              </span>
              <span className="rounded-lg border border-night-100 px-4 py-2">
                Posts: <strong>{profile.mediaCount.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          )}
          {profileError && (
            <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              Conectado, mas não consegui ler o perfil: {profileError}
            </p>
          )}

          <section className="max-w-2xl rounded-xl border border-night-100 p-6">
            <h2 className="mb-4 font-semibold">Publicar post</h2>
            <ComposeForm />
          </section>

          <section className="max-w-2xl rounded-xl border border-night-100 p-6 text-sm text-night-500">
            <h2 className="mb-2 font-semibold text-night-900">Directs (DMs) — fase 2</h2>
            <p>
              A caixa de entrada de directs entra na próxima fase: precisa de um endpoint de webhook
              para receber as mensagens e da permissão de mensagens aprovada. As respostas seguem a
              janela de 24h da Meta (só dá pra responder livremente até 24h após a última mensagem do
              cliente).
            </p>
          </section>
        </>
      )}
    </div>
  )
}
