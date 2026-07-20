# Deploy do Clube da Estampa na Vercel

Guia passo a passo para colocar a loja no ar e ativar a confirmação de
pagamento (Stripe cartão + Cora Pix) via webhook. Siga na ordem.

---

## Pré-requisitos

- Repositório no GitHub/GitLab/Bitbucket (a Vercel faz deploy a partir do git), **ou** a Vercel CLI (`npm i -g vercel`).
- Conta na Vercel.
- As credenciais reais em mãos (Stripe, Cora, Resend) — sem elas o site sobe, mas o pagamento não cobra de verdade.

> Observação: os 4 cron jobs foram removidos da `vercel.json` de propósito, porque as rotas `/api/cron/...` ainda não existem. A gente re-adiciona quando essas rotas forem construídas — assim o primeiro deploy sobe limpo.

---

## Passo 1 — Criar o projeto na Vercel (monorepo)

Como é um monorepo pnpm + Turborepo, o app Next.js fica em `apps/web`.

Nas configurações do projeto na Vercel:

- **Framework Preset:** Next.js
- **Root Directory:** `apps/web`  ← importante
- **Node.js Version:** 22.x
- **Install Command:** deixe o padrão (a Vercel detecta o pnpm workspace).
- **Build Command:** deixe o padrão (`next build`).
- **Output Directory:** deixe o padrão (`.next`).

Os pacotes `@clubedaestampa/*` são compilados automaticamente pelo Next (já estão em `transpilePackages`), então não há passo de build extra.

---

## Passo 2 — Variáveis de ambiente

Em **Project → Settings → Environment Variables**, adicione todas abaixo
(ambiente **Production**, e de preferência também Preview):

### Públicas (podem ir para o navegador)

```
NEXT_PUBLIC_APP_URL=https://SEU_DOMINIO.vercel.app
NEXT_PUBLIC_APP_NAME=Clube da Estampa
NEXT_PUBLIC_SUPABASE_URL=https://pippmbrzwjcwbhmvbveg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do Supabase>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_ou_test_...
```

### Servidor (secretas — nunca expor)

```
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_JWT_SECRET=<opcional>
APP_ENCRYPTION_KEY=<32+ caracteres aleatórios>
CRON_SECRET=<segredo aleatório>
WEBHOOK_INTERNAL_SECRET=<segredo aleatório — usado para registrar o webhook da Cora>

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Clube da Estampa <pedidos@seudominio.com.br>

STRIPE_SECRET_KEY=sk_live_ou_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # preenchido no Passo 4

CORA_ENV=stage                          # ou "production"
CORA_CLIENT_ID=...
CORA_CERT_BASE64=<certificado .pem em base64>
CORA_KEY_BASE64=<chave privada .key em base64>
```

> Dica para o base64 da Cora (PowerShell):
> `[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pem"))`

---

## Passo 3 — Primeiro deploy

1. Rode o deploy (push no git, ou `vercel --prod`).
2. Quando terminar, copie o domínio final (ex.: `https://clubedaestampa.vercel.app`).
3. Volte em Environment Variables e ajuste **`NEXT_PUBLIC_APP_URL`** para esse domínio final.
4. **Redeploy** (para o novo valor valer).

---

## Passo 4 — Webhook da Stripe (cartão)

1. No painel da Stripe: **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:**
   ```
   https://SEU_DOMINIO/api/payments/webhook
   ```
3. **Eventos a escutar:**
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
4. Salve, copie o **Signing secret** (`whsec_...`) e cole em `STRIPE_WEBHOOK_SECRET` na Vercel.
5. **Redeploy.**

---

## Passo 5 — Webhook da Cora (Pix)

A Cora registra o webhook via API. Já deixei uma rota pronta e protegida por token.

1. Confirme que `WEBHOOK_INTERNAL_SECRET` e as credenciais da Cora estão nas env vars (Passo 2) e que houve redeploy.
2. Acesse **uma vez** (no navegador ou via curl):
   ```
   https://SEU_DOMINIO/api/admin/cora/register-webhook?token=SEU_WEBHOOK_INTERNAL_SECRET
   ```
3. A resposta deve ser `{"ok":true, ...}`. Isso aponta a Cora para `https://SEU_DOMINIO/api/payments/pix/webhook` no evento `invoice.paid`.

---

## Passo 6 — Supabase (Auth)

No painel do Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://SEU_DOMINIO`
- **Redirect URLs:** adicione `https://SEU_DOMINIO/**` (para login/confirmação de e-mail funcionarem no domínio de produção).

---

## Passo 7 — Teste de ponta a ponta

1. Abra a loja no domínio de produção.
2. Adicione um produto ao carrinho → checkout → escolha **Pix**.
3. Pague o Pix de teste. Em segundos, o webhook da Cora deve confirmar e:
   - o pedido vira **Pago** em `/admin/pedidos` e `/conta/pedidos`;
   - o **estoque baixa** (ledger em `inventory_movements`);
   - sai o **e-mail de confirmação** (se o Resend estiver configurado).
4. Repita escolhendo **Cartão** (Stripe Checkout).

Se algo não confirmar, verifique os logs em **Vercel → Deployments → Functions**
(procure por `stripe webhook` / `cora webhook`).

---

## Depois (quando quiser)

- Re-adicionar os cron jobs na `vercel.json` junto com as rotas `/api/cron/*` (reconciliação de pagamentos pendentes, liberação de reservas etc.). Cron sub-horário exige plano Vercel Pro.
- Domínio próprio (Project → Settings → Domains) — lembre de atualizar `NEXT_PUBLIC_APP_URL` e refazer os Passos 4–6 com o novo domínio.
