# Kickoffstore — Setup de desenvolvimento (Fase 1: Fundação)

Este documento explica como instalar, rodar e validar o monorepo em uma máquina
com acesso normal à internet (registro npm liberado).

## Pré-requisitos

- Node.js 22+ (`.nvmrc` fixa a versão 22)
- pnpm 9+ (`corepack enable` ou `npm i -g pnpm`)
- Conta Supabase (para as Fases 2+), Vercel e credenciais dos provedores (opcional nesta fase)

## Instalação

```bash
corepack enable
pnpm install
```

## Variáveis de ambiente

```bash
cp .env.example apps/web/.env.local
# preencha ao menos, para as próximas fases:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
```

A validação de env (`packages/validation/src/env.ts`) foi desenhada para **não
quebrar o build** quando os segredos ainda não existem — as variáveis do servidor
só são exigidas no primeiro uso em runtime, com mensagem de erro clara.

## Comandos de qualidade (rodar antes de concluir qualquer etapa)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Estrutura do monorepo

```
apps/
  web/        Next.js (App Router) — loja + painel (Fases 2+)
  mobile/     Expo Router — app do cliente (Fase 10)
packages/
  config/     tsconfig + eslint compartilhados
  types/      tipos de domínio + contratos de integração (Payment/Fiscal/Shipping)
  validation/ schemas Zod + validação de env
  integrations/ adaptadores atrás de interface (Mercado Pago estruturado)
  ui/         tokens de marca + helpers puros (formatBRL etc.)
supabase/
  migrations/ 0001_initial_schema.sql (já existente no blueprint)
  seed.sql
```

## App mobile

```bash
cd apps/mobile
pnpm start        # Expo dev server
```

Nenhum segredo privado deve entrar no bundle do app (apenas `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`).
