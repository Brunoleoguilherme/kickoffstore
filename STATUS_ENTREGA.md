# Status da entrega — Kickoffstore

> Fases 1, 2 e 3 entregues e **validadas na máquina do usuário** em 2026-07-12.

## Situação atual: BUILD VERDE ✅

Rodados com sucesso em `C:\kickoffstore` (Node 22 + pnpm):

- `pnpm lint` ✅
- `pnpm typecheck` ✅ (6 pacotes)
- `pnpm test` ✅ (18 testes)
- `pnpm build` ✅ (Next.js compila; rotas autenticadas dinâmicas, públicas estáticas)

Observação histórica: o código foi escrito num ambiente sem acesso ao registro npm,
então o build foi validado depois, na máquina do usuário, com pequenos ajustes
(@types/node nos pacotes, ESLint ignorando .cjs, remoção do experimental typedRoutes,
force-dynamic nos layouts /admin e /conta).

## Entregue nesta sessão (Fases 1, 2 e 3 — escritas, pendentes de build)

### Fase 1 — Fundação
- Monorepo pnpm + Turborepo; `packages/config` (tsconfig + ESLint sem `any`).
- `packages/types` (dinheiro em centavos, RBAC, máquina de estados de pedido, contratos
  Payment/Fiscal/Shipping/Email) + testes.
- `packages/validation` (Zod: auth/catálogo/primitivos + validação de env segura) + testes.
- `packages/integrations` (adaptador Mercado Pago estruturado, sem simular) + testes.
- `packages/ui` (tokens de marca próprios + `formatBRL`) + testes.
- `apps/web` (Next.js App Router, Tailwind, Button, layout+SEO, home própria, `/api/health`).
- `apps/mobile` (Expo Router skeleton).

### Fase 2 — Auth & RBAC
- Clientes Supabase: browser, server (SSR/cookies), admin (service role) e middleware de sessão.
- Fluxo de auth: login, cadastro, recuperação e redefinição de senha, callback OAuth e confirmação de e-mail.
- Helpers server-side: `requireUser`, `requirePermission`, `getUserPermissions`, `isStaff`, auditoria.
- Área do cliente `/conta` e painel `/admin` protegidos (gate por permissão, itens de menu por permissão).
- Convite de staff (`inviteUserByEmail` + atribuição de role) com auditoria.
- **Migration `0002_auth_rbac.sql`**: roles do sistema, mapeamento role→permissões, RPC
  `current_user_permissions`, trigger de criação de `profile`, função `grant_role_by_email`
  (bootstrap do admin) e políticas RLS de gestão.

### Fase 3 — Catálogo
- Consultas públicas (respeitando RLS): listagem, produto por slug e busca via RPC.
- Páginas públicas: `/produtos` (com busca) e `/produtos/[slug]` (com metadados/SEO).
- Admin: lista de produtos, criação de produto (server action + permissão + auditoria) e
  importação CSV com validação Zod por linha.
- SEO: `robots.ts` e `sitemap.ts`.
- **Migration `0003_catalog_search.sql`**: RPC `search_products` (FTS + trigram), **revogação
  do `cost_cents` na API pública** (custo só via server/service role), tabela de buscas sem
  resultado, índices trigram e políticas RLS de leitura para staff `catalog.read`.

## Pendências / próximos passos

1. Rodar `pnpm install && pnpm build` localmente e corrigir eventuais ajustes de tipo.
2. Criar projeto Supabase e preencher `.env.local`; aplicar migrations e seed:
   `supabase db reset` (ou aplicar 0001→0003 + seed).
3. Gerar tipos reais do banco: `supabase gen types typescript --linked > packages/types/src/database.ts`
   (substitui o placeholder e melhora a tipagem das queries).
4. Criar o primeiro usuário e promovê-lo a admin:
   `select public.grant_role_by_email('seu-email@dominio.com', 'admin');`
5. Criar o bucket de Storage `product-images` (público) para as imagens de produto.
6. Itens ainda não implementados nesta rodada (scaffold a completar nas próximas fases):
   CRUD de categorias/marcas/esportes/atributos no admin, upload de imagem pela UI,
   testes de integração de RLS (exigem instância Supabase), e as Fases 4+.

## Verificações feitas aqui (sem instalar dependências)
- Todos os arquivos JSON válidos.
- Nenhum segredo hardcoded.
- Nenhum `any` explícito no código de aplicação.
