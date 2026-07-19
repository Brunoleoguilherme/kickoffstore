'use client'

import { useState } from 'react'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    setStatus(valid ? 'ok' : 'error')
  }

  return (
    <section className="border-y border-white/5 bg-surface">
      <div className="mx-auto max-w-[1440px] px-6 py-16 text-center sm:px-8">
        <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
          Entre para o time
        </h2>
        <p className="mx-auto mt-2 max-w-md text-night-300">
          Receba lançamentos, ofertas exclusivas e conteúdo por modalidade.
        </p>
        <form onSubmit={onSubmit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
          <label htmlFor="newsletter-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setStatus('idle')
            }}
            placeholder="seu@email.com"
            className="h-12 flex-1 rounded-lg border border-white/15 bg-night-900 px-4 text-sm text-white outline-none placeholder:text-night-500 focus-visible:border-brand-500"
          />
          <button
            type="submit"
            className="h-12 rounded-lg bg-brand-500 px-6 text-sm font-semibold uppercase tracking-wide text-night-900 transition-colors hover:bg-brand-400"
          >
            Inscrever
          </button>
        </form>
        {status === 'ok' && (
          <p role="status" className="mt-3 text-sm font-medium text-brand-500">
            Pronto! Você está no time. ⚡
          </p>
        )}
        {status === 'error' && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            Informe um e-mail válido.
          </p>
        )}
      </div>
    </section>
  )
}
