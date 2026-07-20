# Clube da Estampa — Blueprint técnico e operacional

Este repositório é um **manual executável para Claude Code**, VS Code, GitHub, Vercel, Supabase, Resend e Expo/EAS. Ele descreve como construir uma operação completa de comércio eletrônico esportivo com site, aplicativo, painel administrativo, catálogo, estoque, compras, notas fiscais, pagamentos, logística, marketing e atendimento.

> A Centauro foi usada apenas como referência funcional de um grande e-commerce esportivo. Não copie identidade visual, textos, imagens, código, estrutura proprietária ou elementos protegidos. A Clube da Estampa deve possuir marca, experiência e conteúdo próprios.

## O que está incluído

- `CLAUDE.md`: instruções persistentes para o Claude Code.
- `docs/`: arquitetura, módulos, modelo de dados, integrações, segurança, operação e roadmap.
- `supabase/migrations/0001_initial_schema.sql`: base de banco de dados para o MVP.
- `supabase/seed.sql`: dados iniciais de desenvolvimento.
- `prompts/`: prompts por fase para o Claude executar com segurança.
- `.env.example`: variáveis de ambiente esperadas.
- `.github/workflows/ci.yml`: pipeline inicial de qualidade.
- `vercel.json`: configuração de cron e cabeçalhos básicos.

## Stack definida

### Web
- Next.js App Router + TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form + Zod
- Server Components por padrão
- Route Handlers para APIs e webhooks

### Backend e dados
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Row Level Security em todas as tabelas expostas
- Supabase Realtime apenas onde houver ganho operacional

### Aplicativo
- React Native com Expo
- Expo Router
- EAS Build, EAS Submit e EAS Update
- Mesma autenticação e banco do site

### Integrações iniciais
- Mercado Pago: Pix, cartão, boleto, reembolsos e webhooks
- Nuvem Fiscal: NF-e, NFC-e opcional, XML, DANFE e eventos fiscais
- Melhor Envio: cotação, compra de etiqueta e rastreio
- Resend: e-mails transacionais e eventos de entrega
- Expo Notifications: notificações push

## Arquitetura de repositório recomendada

```text
clubedaestampa/
├─ apps/
│  ├─ web/                     # Next.js: loja + painel administrativo
│  └─ mobile/                  # Expo: app do cliente
├─ packages/
│  ├─ ui/                      # componentes compartilhados quando possível
│  ├─ types/                   # tipos de domínio e contratos de integração
│  ├─ validation/              # schemas Zod compartilhados
│  ├─ config/                  # eslint, tsconfig, constantes
│  └─ integrations/            # adaptadores de pagamento, fiscal, frete e e-mail
├─ supabase/
│  ├─ migrations/
│  ├─ seed.sql
│  └─ functions/
├─ docs/
├─ prompts/
├─ .github/workflows/
├─ CLAUDE.md
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ .env.example
```

## Ordem obrigatória de construção

1. Fundação do monorepo e padrões de qualidade.
2. Banco de dados, autenticação, perfis e permissões.
3. Catálogo, categorias, marcas, produtos, variações e imagens.
4. Estoque, armazéns e movimentações.
5. Loja pública, busca, carrinho e checkout.
6. Pagamentos e webhooks idempotentes.
7. Pedido, separação, faturamento e envio.
8. E-mails transacionais.
9. Painel administrativo e financeiro.
10. Aplicativo mobile.
11. Marketing, fidelidade, reviews e marketplace.

## Como iniciar com Claude Code

1. Crie um repositório vazio no GitHub.
2. Copie este blueprint para a raiz.
3. Abra a pasta no VS Code.
4. Inicialize o Git.
5. Abra o Claude Code na raiz do projeto.
6. Envie o conteúdo de `prompts/00-master.md`.
7. Execute os prompts por fase em ordem.
8. Não pule migrations, testes, RLS ou revisão de segurança.

## Comandos de referência

```bash
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Para Supabase local:

```bash
supabase start
supabase db reset
supabase gen types typescript --local > packages/types/src/database.ts
```

Para o app:

```bash
cd apps/mobile
npx expo start
npx eas build --platform android
npx eas build --platform ios
```

## Regra de entrega

Nenhuma fase está concluída apenas porque a tela abre. Cada fase deve ter:

- migrations versionadas;
- RLS revisado;
- validação no servidor;
- tratamento de erro;
- logs úteis sem dados sensíveis;
- testes mínimos;
- documentação atualizada;
- build sem erro;
- checklist de aceite cumprido.
