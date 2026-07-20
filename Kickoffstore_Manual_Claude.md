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


---

# Instruções permanentes do Claude

# CLAUDE.md — Clube da Estampa

## Missão

Construir e manter a Clube da Estampa como plataforma própria de comércio eletrônico esportivo, com site, aplicativo e painel operacional. O sistema deve ser seguro, auditável, responsivo, acessível, modular e preparado para crescer sem perder controle financeiro, fiscal ou de estoque.

## Princípios inegociáveis

1. Não copiar código, textos, imagens, identidade visual ou layout proprietário de concorrentes.
2. Usar TypeScript estrito. Não adicionar `any` sem justificativa documentada.
3. Server Components por padrão no Next.js. Usar Client Components somente quando necessário.
4. Toda entrada externa deve ser validada com Zod no servidor.
5. Toda tabela exposta pelo Supabase deve ter RLS habilitado e políticas explícitas.
6. Nunca colocar `SUPABASE_SERVICE_ROLE_KEY`, tokens fiscais, tokens de pagamento ou chaves privadas no cliente.
7. Nunca armazenar número completo de cartão, CVV ou dados brutos de pagamento.
8. Webhooks devem validar autenticidade, ser idempotentes e responder rapidamente.
9. Dinheiro deve ser armazenado em centavos inteiros (`bigint`), nunca em `float`.
10. Estoque deve ser movimentado por registros imutáveis e auditáveis.
11. Pedidos e documentos fiscais não devem ser apagados fisicamente em produção.
12. Toda alteração crítica deve gerar `audit_logs`.
13. Migrations são append-only. Não reescrever migration já aplicada em produção.
14. Segredos ficam em `.env.local`, Vercel Environment Variables, Supabase Secrets ou GitHub Secrets.
15. Não executar ações destrutivas em produção sem confirmação explícita.

## Stack

- Monorepo: pnpm workspaces + Turborepo.
- Web: Next.js App Router, TypeScript, Tailwind e shadcn/ui.
- Forms: React Hook Form + Zod.
- Banco/Auth/Storage: Supabase.
- E-mail: Resend + React Email.
- Pagamentos: adaptador inicial Mercado Pago.
- Fiscal: adaptador inicial Nuvem Fiscal.
- Frete: adaptador inicial Melhor Envio.
- App: Expo + Expo Router + EAS.
- Testes: Vitest, Testing Library e Playwright.
- CI: GitHub Actions.
- Deploy web: Vercel.

## Estrutura de domínio

Separe o código por domínio, não apenas por tipo técnico:

```text
src/modules/catalog
src/modules/inventory
src/modules/checkout
src/modules/orders
src/modules/payments
src/modules/fiscal
src/modules/shipping
src/modules/customers
src/modules/marketing
src/modules/support
src/modules/finance
```

Cada módulo pode conter:

```text
components/
queries/
actions/
services/
repositories/
schemas/
types/
tests/
```

## Contratos de integração

Toda integração deve estar atrás de uma interface. A aplicação não deve espalhar chamadas diretas ao fornecedor.

```ts
export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>
  getPayment(externalId: string): Promise<PaymentSnapshot>
  refund(input: RefundInput): Promise<RefundResult>
  verifyWebhook(input: WebhookVerificationInput): Promise<boolean>
}

export interface FiscalProvider {
  issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult>
  getInvoice(externalId: string): Promise<FiscalDocumentSnapshot>
  cancelInvoice(input: CancelInvoiceInput): Promise<CancelInvoiceResult>
  downloadXml(externalId: string): Promise<Buffer>
  downloadDanfe(externalId: string): Promise<Buffer>
}

export interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingQuote[]>
  purchaseLabel(input: PurchaseLabelInput): Promise<ShippingLabelResult>
  track(externalId: string): Promise<TrackingSnapshot>
}
```

## Regras de banco de dados

- Use UUID como chave primária.
- Use `created_at`, `updated_at` e, quando necessário, `deleted_at`.
- Use `numeric` apenas para percentuais ou quantidades fracionadas; valores monetários em centavos.
- Crie índices para FKs, slugs, SKUs, status e datas de consulta frequente.
- Use transações para operações de pedido, reserva, pagamento e estoque.
- Não atualize saldo de estoque sem criar movimento correspondente.
- Mantenha `webhook_events` com chave única de provedor + ID externo.
- Use `metadata jsonb` somente para extensão, nunca para esconder campos essenciais.

## Regras de autenticação e autorização

Perfis mínimos:

- `customer`: cliente da loja.
- `support`: atendimento.
- `warehouse`: estoque e expedição.
- `catalog`: catálogo e conteúdo.
- `finance`: financeiro e conciliação.
- `fiscal`: documentos fiscais.
- `manager`: gestão operacional.
- `admin`: administração total.

Não confiar apenas na UI. Todas as permissões devem ser verificadas no banco ou servidor.

## Fluxo de pedido

Estados recomendados:

```text
draft
awaiting_payment
payment_processing
paid
fiscal_pending
fiscal_authorized
picking
packed
shipped
delivered
cancel_requested
cancelled
return_requested
returned
refunded
```

O histórico de status é append-only.

## Fluxo de estoque

- `on_hand`: estoque físico.
- `reserved`: comprometido com carrinho/pedido.
- `available = on_hand - reserved`.
- Reserva expira automaticamente.
- Pagamento aprovado converte reserva em compromisso de pedido.
- Cancelamento libera reserva ou devolve saldo, conforme a etapa.
- Devolução só reintegra estoque após inspeção.

## Fluxo fiscal

1. Pedido pago.
2. Validar cadastro, itens e dados fiscais.
3. Criar solicitação fiscal idempotente.
4. Emitir documento via adaptador.
5. Aguardar autorização por polling controlado ou webhook.
6. Salvar chave, protocolo, XML e DANFE.
7. Enviar documento ao cliente.
8. Liberar expedição conforme regra de negócio.

Campos como NCM, CEST, CFOP, CST/CSOSN, origem e alíquotas devem ser confirmados com contador. Não inventar tributação.

## Webhooks

Para cada webhook:

1. Capturar corpo bruto quando a assinatura exigir.
2. Validar assinatura/origem.
3. Extrair ID externo.
4. Inserir em `webhook_events` com restrição única.
5. Se duplicado, retornar 200 sem reprocessar.
6. Persistir payload redigido quando necessário.
7. Enfileirar ou processar operação curta.
8. Atualizar domínio em transação.
9. Registrar erro e permitir reprocessamento manual.

## E-mails

- Templates em React Email.
- Nunca enviar pelo navegador.
- Registrar tentativa, status e ID do Resend.
- Processar `delivered`, `bounced`, `complained` e `opened` quando permitido.
- Remover ou suprimir endereços com bounce permanente.
- E-mail transacional não depende de consentimento de marketing.
- Marketing só após consentimento válido e com descadastro.

## Aplicativo

O app deve compartilhar contratos e validações, não componentes web inteiros. Implementar:

- login e cadastro;
- catálogo e busca;
- produto;
- favoritos;
- carrinho;
- checkout seguro;
- pedidos e rastreio;
- notificações push;
- perfil e endereços;
- suporte.

## Qualidade obrigatória antes de concluir uma tarefa

Execute:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Quando a mudança envolver checkout, pedido, estoque, pagamento, fiscal ou autorização, adicionar testes específicos.

## Git

- Uma mudança lógica por commit.
- Mensagens no padrão Conventional Commits.
- Não commitar `.env`, arquivos de certificado, chaves, XML fiscal real ou dados pessoais.
- Não fazer force push na branch principal.
- Abrir PR para mudanças relevantes.

## Como trabalhar

Antes de alterar código:

1. Ler `README.md` e docs do domínio afetado.
2. Inspecionar schema e migrations existentes.
3. Mapear impacto em web, mobile, banco e integrações.
4. Apresentar plano curto.
5. Implementar em pequenos passos.
6. Rodar testes.
7. Atualizar documentação.
8. Informar arquivos alterados e riscos restantes.

## Proibições

- Não criar mock permanente em fluxo financeiro/fiscal.
- Não marcar pagamento como aprovado apenas pelo retorno do navegador.
- Não confiar em preço enviado pelo cliente.
- Não calcular total final somente no frontend.
- Não expor estoque de custo, margem ou dados de fornecedor na API pública.
- Não permitir que cliente consulte pedido de outro cliente.
- Não permitir upload sem validar tipo, tamanho e destino.
- Não usar service role em código executado no navegador.
- Não emitir nota fiscal antes de garantir idempotência.
- Não usar dados reais em seed ou testes.


---

# 00 — Visão geral do produto

## 1. Objetivo

A Clube da Estampa será uma plataforma omnichannel de artigos esportivos, inicialmente com operação digital e estrutura pronta para loja física, retirada, PDV e marketplace. O produto deve unir:

- experiência de compra rápida;
- operação administrativa centralizada;
- controle de estoque confiável;
- financeiro e conciliação;
- emissão e recebimento de documentos fiscais;
- logística e rastreio;
- comunicação transacional e marketing;
- aplicativo Android e iOS.

## 2. Referência funcional

Grandes varejistas esportivos trabalham com navegação por esporte, gênero, idade, categoria, marca, faixa de preço e performance. Também oferecem busca, cálculo por CEP, conta do cliente, acompanhamento de pedidos, meios de pagamento, trocas, conteúdo, aplicativo e, em operações maiores, retirada e marketplace.

A Clube da Estampa adotará esses padrões de mercado com desenho próprio e implantação progressiva.

## 3. Públicos

### Cliente final

Compra produtos, acompanha pedidos, salva favoritos, gerencia endereços, solicita troca/devolução e recebe suporte.

### Operação interna

Administra catálogo, preços, estoque, compras, recebimento, pedidos, expedição, fiscal, financeiro, atendimento, marketing e relatórios.

### Fornecedor

No futuro, pode acessar portal restrito para catálogo, pedidos de compra, documentos e SLA.

### Seller de marketplace

Módulo futuro. Deve ser isolado do estoque próprio e possuir comissões, repasses, SLA e documentos específicos.

## 4. Proposta de valor

- Especialização em esporte.
- Curadoria técnica por modalidade.
- Jornada simples no site e app.
- Estoque e pedido sincronizados.
- Operação fiscal e financeira auditável.
- Base tecnológica própria, sem dependência total de plataforma fechada.

## 5. Escopo do MVP

### Loja

- Home, vitrines, categorias e campanhas.
- Catálogo, filtros, busca e ordenação.
- Página de produto com variações.
- Cadastro, login e recuperação de senha.
- Favoritos.
- Carrinho.
- Endereços.
- Checkout com Pix, cartão e boleto.
- Frete e prazo por CEP.
- Área do cliente e acompanhamento.
- Solicitação de cancelamento e devolução.
- Páginas institucionais e políticas.

### Administração

- Dashboard.
- Produtos, SKUs, categorias, marcas e imagens.
- Estoque e movimentações.
- Fornecedores e pedidos de compra.
- Recebimento de mercadoria.
- Pedidos e expedição.
- Pagamentos e conciliação.
- Documentos fiscais.
- Clientes.
- Cupons e campanhas.
- E-mails e notificações.
- Usuários, perfis e permissões.
- Auditoria.

### Aplicativo

- Catálogo e busca.
- Produto e favoritos.
- Carrinho e checkout.
- Pedidos e rastreio.
- Perfil.
- Push.

## 6. Fora do MVP, mas previsto

- Marketplace multi-seller.
- PDV e NFC-e.
- Retire na loja.
- Gift card.
- Clube de fidelidade.
- Assinaturas.
- B2B para clubes, academias e empresas.
- Personalização de uniformes.
- Recomendação por IA.
- Programa de afiliados.

## 7. Indicadores principais

### Comercial

- Receita bruta e líquida.
- Pedidos aprovados.
- Ticket médio.
- Taxa de conversão.
- Abandono de carrinho.
- Receita por canal e campanha.

### Produto

- Produtos mais vistos.
- Conversão por produto.
- Busca sem resultado.
- Ruptura de estoque.
- Margem por SKU.

### Operação

- Tempo de aprovação até faturamento.
- Tempo de picking e packing.
- Pedidos enviados no SLA.
- Atrasos e extravios.
- Taxa de troca/devolução.

### Financeiro

- Taxas de pagamento.
- Chargebacks.
- Valor a receber.
- Divergências de conciliação.
- Contas a pagar e fluxo de caixa.

## 8. Critérios de sucesso do lançamento

- Nenhum pedido aprovado sem registro financeiro.
- Nenhum estoque negativo sem autorização e auditoria.
- Webhooks duplicados não duplicam efeitos.
- Cliente vê apenas os próprios dados.
- Fiscal consegue reprocessar falhas.
- Expedição só imprime etiqueta de pedido elegível.
- E-mails transacionais possuem rastreabilidade.
- Site atende Core Web Vitals e requisitos básicos de acessibilidade.


---

# 01 — Arquitetura

## 1. Visão de alto nível

```text
Cliente Web ─┐
             ├─> Next.js / Vercel ─> Supabase Postgres/Auth/Storage
App Expo ────┘          │
                         ├─> Mercado Pago
                         ├─> Nuvem Fiscal
                         ├─> Melhor Envio
                         ├─> Resend
                         └─> Expo Push
```

O Next.js funciona como storefront, painel administrativo e camada BFF. O aplicativo consome endpoints seguros e o Supabase conforme as políticas de acesso. Integrações críticas são chamadas somente no servidor.

## 2. Monorepo

Use pnpm workspaces e Turborepo para compartilhar tipos, validações e integrações.

```text
apps/web
apps/mobile
packages/types
packages/validation
packages/integrations
packages/config
packages/ui
```

Não force compartilhamento de UI entre web e React Native quando isso piorar manutenção. Compartilhe tokens, contratos e regras.

## 3. Camadas

### Apresentação

- páginas públicas;
- área do cliente;
- painel administrativo;
- aplicativo.

### Aplicação

- casos de uso;
- orquestração de checkout;
- criação de pedidos;
- reservas;
- emissão fiscal;
- expedição;
- conciliação.

### Domínio

- entidades;
- estados;
- regras de transição;
- validações de negócio;
- eventos.

### Infraestrutura

- Supabase;
- adaptadores externos;
- storage;
- e-mail;
- observabilidade.

## 4. Padrão de API

Use Route Handlers do Next.js em `app/api`. Endpoints internos devem validar sessão, função e entrada. Endpoints de webhook não usam sessão de usuário; usam assinatura do provedor e service role no servidor.

Padrão de resposta:

```json
{
  "data": {},
  "error": null,
  "meta": {
    "requestId": "uuid"
  }
}
```

Erros:

```json
{
  "data": null,
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "Um item não possui estoque disponível.",
    "details": {}
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

## 5. Server Components e cache

- Catálogo público pode usar cache e revalidação.
- Preço, estoque e carrinho devem ser atualizados com cuidado.
- Checkout, conta e admin são dinâmicos e autenticados.
- Após alteração de produto, revalidar páginas e tags do catálogo.
- Nunca cachear resposta personalizada sem chave de usuário.

## 6. Eventos de domínio

Crie uma tabela de `domain_events` ou fila leve para desacoplar efeitos:

- `order.created`
- `payment.approved`
- `payment.failed`
- `invoice.authorized`
- `shipment.created`
- `shipment.delivered`
- `return.approved`

Cada consumidor deve ser idempotente.

## 7. Assíncrono

No MVP:

- registrar jobs em tabela;
- cron autenticado processa lotes pequenos;
- retry com backoff;
- dead-letter após limite;
- reprocessamento manual no admin.

Não manter requisição HTTP aberta para tarefas longas. Em escala, migrar consumidores para funções dedicadas ou fila gerenciada.

## 8. Storage

Buckets recomendados:

- `product-images`: público ou CDN controlada.
- `fiscal-documents`: privado.
- `supplier-documents`: privado.
- `return-evidence`: privado.
- `support-attachments`: privado.
- `brand-assets`: público.

Uploads privados devem usar signed URLs de curta duração.

## 9. Busca

MVP:

- PostgreSQL Full Text Search;
- extensão `pg_trgm` para tolerância a erro;
- índice em nome, marca, categoria, esporte, SKU e termos normalizados;
- tabela de sinônimos.

Evolução:

- motor externo para grande volume, ranking avançado e personalização.

## 10. Multiempresa

Mesmo que exista uma única empresa, inclua `organization_id` nas tabelas operacionais críticas. Isso simplifica filiais, CNPJs, depósitos e expansão futura.

## 11. Ambientes

- Local: Supabase local, sandbox dos provedores e e-mails de teste.
- Preview: banco de staging e credenciais sandbox.
- Produção: banco e credenciais isoladas.

Nunca usar o banco de produção em Vercel Preview.

## 12. Resiliência

- timeouts em chamadas externas;
- retries apenas em operações seguras;
- idempotency keys;
- circuit breaker simples para falhas repetidas;
- status intermediários claros;
- reconciliação periódica com provedores;
- logs com request ID.


---

# 02 — Módulos funcionais

## 1. Storefront

### Home

- banner principal;
- campanhas;
- vitrines por esporte;
- lançamentos;
- mais vendidos;
- ofertas;
- marcas;
- conteúdo editorial;
- benefícios de compra;
- newsletter.

Conteúdo deve ser gerenciado pelo admin, com agendamento e segmentação.

### Navegação

- esporte;
- público: masculino, feminino, infantil e unissex;
- categoria;
- subcategoria;
- marca;
- coleção;
- clube/time;
- uso: treino, jogo, casual, viagem;
- performance.

### Busca

- autocomplete;
- histórico local;
- sugestões;
- sinônimos;
- busca por SKU;
- correção tolerante;
- registro de termos sem resultado.

### Listagem

Filtros:

- preço;
- tamanho;
- cor;
- marca;
- esporte;
- gênero;
- idade;
- disponibilidade;
- desconto;
- avaliação.

Ordenação:

- relevância;
- mais vendidos;
- lançamentos;
- menor preço;
- maior preço;
- maior desconto;
- melhor avaliação.

### Produto

- galeria;
- vídeo opcional;
- nome e marca;
- preço e preço anterior;
- desconto;
- parcelamento;
- seleção de cor e tamanho;
- estoque;
- tabela de medidas;
- descrição;
- especificações;
- garantia;
- seller;
- cálculo de frete;
- recomendações;
- reviews;
- perguntas frequentes.

O preço e estoque finais devem ser recalculados no servidor.

## 2. Cliente

- cadastro;
- login;
- login social opcional;
- endereços;
- preferências;
- consentimentos;
- pedidos;
- notas fiscais;
- rastreio;
- favoritos;
- avaliações;
- solicitações de troca/devolução;
- suporte;
- exclusão ou anonimização conforme política e obrigação legal.

## 3. Carrinho

- persistência para usuário logado;
- carrinho anônimo por token;
- merge após login;
- atualização de quantidade;
- validação de estoque;
- cupom;
- estimativa de frete;
- resumo de desconto;
- itens salvos para depois;
- expiração controlada.

## 4. Checkout

Etapas:

1. identificação;
2. endereço;
3. entrega;
4. pagamento;
5. revisão;
6. confirmação.

Regras:

- recalcular preços;
- validar cupom;
- reservar estoque;
- gerar pedido antes do pagamento;
- usar idempotency key;
- não aprovar por retorno do frontend;
- confirmar via webhook/consulta do provedor.

## 5. Catálogo administrativo

- categorias hierárquicas;
- marcas;
- esportes;
- atributos;
- produtos;
- variantes/SKUs;
- imagens;
- kits;
- produtos relacionados;
- SEO;
- status de publicação;
- importação CSV;
- revisão em lote;
- histórico de alteração.

Campos mínimos de SKU:

- SKU interno;
- EAN/GTIN;
- cor;
- tamanho;
- custo;
- preço;
- peso e dimensões;
- NCM;
- CEST quando aplicável;
- origem;
- unidade;
- fornecedor;
- estoque mínimo.

## 6. Preços e promoções

- preço padrão;
- preço promocional com vigência;
- tabelas B2C/B2B;
- cupom percentual;
- cupom valor fixo;
- frete grátis;
- leve X pague Y;
- desconto por categoria/marca;
- primeira compra;
- regras de combinação;
- orçamento máximo de campanha;
- limite por cliente.

O mecanismo deve explicar por que um desconto foi aplicado.

## 7. Estoque e WMS leve

- depósitos;
- endereços de estoque;
- saldos;
- reservas;
- entradas;
- saídas;
- ajustes;
- transferências;
- inventário;
- avaria;
- devolução;
- estoque mínimo;
- curva ABC;
- lote/série opcional.

Operações:

- recebimento;
- put-away;
- picking;
- packing;
- expedição;
- devolução.

## 8. Compras e recebimento

- fornecedores;
- produtos por fornecedor;
- cotação;
- pedido de compra;
- aprovação;
- previsão de entrega;
- recebimento parcial;
- conferência de quantidade;
- conferência de custo;
- importação XML;
- divergência;
- contas a pagar;
- atualização de custo médio conforme política contábil.

## 9. OMS — gestão de pedidos

- fila de pedidos;
- filtros por status e SLA;
- timeline;
- pagamento;
- antifraude quando aplicável;
- fiscal;
- separação;
- embalagem;
- envio;
- cancelamento;
- devolução;
- reembolso;
- atendimento associado.

## 10. Fiscal

### Saída

- NF-e para venda de mercadoria;
- NFC-e para PDV futuro;
- cancelamento;
- carta de correção quando aplicável;
- inutilização quando necessária;
- XML e DANFE;
- envio ao cliente;
- contingência definida com contador/provedor.

### Entrada

- importação de XML;
- manifestação do destinatário quando aplicável;
- vínculo com fornecedor e pedido de compra;
- conferência;
- armazenamento de XML;
- prevenção de duplicidade por chave de acesso.

### Governança

Tributação deve ser configurada com contador. O sistema deve validar presença dos campos, não inventar regras fiscais.

## 11. Financeiro

- contas a receber;
- contas a pagar;
- parcelas;
- taxas;
- antecipação;
- reembolsos;
- chargebacks;
- conciliação por transação;
- conciliação por repasse;
- fluxo de caixa;
- centros de custo;
- margem por pedido e SKU;
- exportação contábil.

## 12. Logística

- cotação;
- seleção de serviço;
- prazo;
- geração de etiqueta;
- declaração de conteúdo quando aplicável;
- PLP/manifestações quando aplicável;
- código de rastreio;
- eventos;
- atraso;
- extravio;
- reenvio;
- logística reversa.

## 13. Atendimento

- tickets;
- origem: site, app, e-mail e WhatsApp futuro;
- assunto;
- prioridade;
- SLA;
- pedido relacionado;
- mensagens;
- anexos;
- notas internas;
- macros;
- satisfação.

## 14. Marketing e CRM

- segmentos;
- newsletter;
- campanhas;
- cupons;
- carrinho abandonado;
- pós-compra;
- reposição de estoque;
- aniversário;
- recomendação;
- UTM;
- consentimento;
- supressão;
- atribuição.

## 15. Conteúdo e SEO

- páginas institucionais;
- blog;
- guias por esporte;
- páginas de marca;
- FAQ;
- metadados;
- schema.org;
- sitemap;
- canonical;
- redirects;
- Open Graph;
- imagens otimizadas.

## 16. Aplicativo

### Cliente

- onboarding;
- autenticação;
- home;
- busca;
- categorias;
- produto;
- favoritos;
- carrinho;
- checkout;
- pedidos;
- rastreio;
- perfil;
- suporte;
- push.

### Futuro operacional

App interno para leitura de código de barras, recebimento, picking, packing e inventário.

## 17. Relatórios

- vendas por período;
- vendas por canal;
- margem;
- estoque;
- giro;
- ruptura;
- compras;
- fornecedores;
- pagamentos;
- conciliação;
- fiscal;
- frete;
- trocas;
- clientes;
- marketing;
- SLA operacional.


---

# 03 — Modelo de dados

## 1. Convenções

- PK: `uuid`.
- Datas: `timestamptz` em UTC.
- Dinheiro: `bigint` em centavos.
- Quantidade: `numeric(14,3)` quando puder ser fracionada.
- Exclusão lógica apenas quando juridicamente e operacionalmente adequada.
- Documentos fiscais, pagamentos e movimentos de estoque são imutáveis ou versionados.

## 2. Núcleo organizacional

### `organizations`

Empresa ou operação jurídica.

### `organization_units`

Filiais, lojas, escritórios e centros de distribuição.

### `profiles`

Dados complementares ao `auth.users`.

### `roles`, `permissions`, `user_roles`, `role_permissions`

RBAC.

## 3. Cliente

### `customers`

- vínculo opcional com auth user;
- nome;
- CPF/CNPJ criptografado ou protegido;
- data de nascimento opcional;
- telefone;
- status;
- origem.

### `customer_addresses`

Endereços versionados. O pedido guarda snapshot para não mudar após a compra.

### `consent_logs`

Registro de aceite, finalidade, versão, origem e revogação.

### `customer_devices`

Tokens push e plataforma.

## 4. Catálogo

### `sports`

Modalidades.

### `categories`

Árvore de categorias com `parent_id`.

### `brands`

Marca, slug, logo e status.

### `products`

Produto conceitual.

### `product_variants`

SKU vendável.

### `product_images`

Imagem por produto ou variante, ordenação e alt text.

### `attributes`, `attribute_values`, `variant_attribute_values`

Tamanho, cor, material e outros atributos.

### `product_channels`

Publicação e disponibilidade por canal.

## 5. Preços

### `price_lists`

Tabela B2C, B2B ou canal.

### `variant_prices`

Preço por SKU, tabela e vigência.

### `promotions`

Campanhas.

### `promotion_rules` e `promotion_actions`

Condições e benefício.

### `coupons` e `coupon_redemptions`

Códigos, limites e usos.

## 6. Estoque

### `warehouses`

Depósitos.

### `stock_locations`

Rua, módulo, nível, posição.

### `inventory_balances`

Saldo agregado por variante e depósito.

### `inventory_movements`

Ledger de movimentos.

### `inventory_reservations`

Reserva temporária ou de pedido.

### `stock_counts`

Inventários físicos.

## 7. Compras

### `suppliers`

Cadastro do fornecedor.

### `supplier_products`

SKU do fornecedor, custo e prazo.

### `purchase_orders` e `purchase_order_items`

Pedido de compra.

### `goods_receipts` e `goods_receipt_items`

Recebimento parcial/total.

### `incoming_invoices` e `incoming_invoice_items`

XML de entrada e vínculo com recebimento.

## 8. Carrinho e desejo

### `carts` e `cart_items`

Carrinho autenticado ou anônimo.

### `wishlists` e `wishlist_items`

Favoritos.

## 9. Pedidos

### `orders`

Cabeçalho, cliente, totais, endereço snapshot, status e canal.

### `order_items`

Snapshot de SKU, nome, preço, desconto, imposto e custo.

### `order_status_history`

Histórico.

### `order_notes`

Notas públicas ou internas.

## 10. Pagamentos

### `payments`

Intenção de pagamento por pedido.

### `payment_transactions`

Transações do provedor.

### `refunds`

Reembolsos.

### `chargebacks`

Contestações.

### `payment_settlements`

Repasses e taxas.

## 11. Fiscal

### `fiscal_documents`

NF-e, NFC-e, NFS-e futura, XML, DANFE, chave e status.

### `fiscal_events`

Cancelamento, correção, autorização e rejeição.

### `tax_profiles`

Perfis tributários configurados com contador.

## 12. Logística

### `shipments`

Remessa por pedido.

### `shipment_packages`

Volumes.

### `shipment_events`

Rastreio.

### `shipping_quotes`

Cotações selecionadas ou exibidas.

## 13. Pós-venda

### `returns` e `return_items`

Troca, devolução e inspeção.

### `store_credits`

Crédito futuro.

### `reviews`

Avaliação de compra verificada.

## 14. Comunicação

### `notification_templates`

Templates e versões.

### `notification_jobs`

Fila.

### `notification_deliveries`

Status do envio.

### `email_suppressions`

Bounce, complaint e descadastro.

## 15. Atendimento

### `support_tickets`

Ticket e SLA.

### `support_messages`

Mensagens e notas internas.

### `support_attachments`

Anexos.

## 16. Conteúdo

### `pages`, `banners`, `collections`, `blog_posts`

CMS leve.

## 17. Plataforma

### `webhook_events`

Inbox idempotente.

### `outbox_events`

Eventos a processar.

### `job_queue`

Jobs com retry.

### `audit_logs`

Quem fez, o quê, quando, onde e antes/depois redigido.

### `feature_flags`

Liberação progressiva.

## 18. Índices críticos

- `product_variants(sku)` unique.
- `product_variants(ean)` quando presente.
- `products(slug)` unique por organização.
- `orders(order_number)` unique.
- `webhook_events(provider, external_event_id)` unique.
- `incoming_invoices(access_key)` unique.
- `fiscal_documents(access_key)` unique quando autorizado.
- `inventory_balances(warehouse_id, variant_id)` unique.
- `inventory_reservations(expires_at, status)`.
- `orders(customer_id, created_at desc)`.
- `shipment_events(shipment_id, occurred_at)`.

## 19. Snapshots

O pedido deve armazenar cópias dos dados usados na compra:

- nome do produto;
- SKU;
- preço;
- desconto;
- endereço;
- frete;
- tributação aplicada;
- seller;
- custo quando necessário para margem.

Isso evita alterar histórico quando o catálogo mudar.


---

# 04 — Integrações

## 1. Padrão geral

Cada provedor deve possuir:

- interface interna;
- implementação concreta;
- mapeamento de status;
- timeout;
- retry seguro;
- idempotência;
- logs;
- ambiente sandbox;
- testes de contrato;
- tela de diagnóstico no admin.

## 2. Mercado Pago

### Escopo

- Pix;
- cartão;
- boleto;
- consulta;
- cancelamento;
- reembolso;
- chargeback;
- webhook.

### Fluxo

1. Servidor cria pedido local.
2. Servidor cria checkout/transação no provedor.
3. Cliente realiza pagamento.
4. Página de retorno mostra estado provisório.
5. Webhook é validado.
6. Servidor consulta o pagamento no provedor.
7. Pedido é atualizado em transação.
8. Evento `payment.approved` dispara fiscal e comunicação.

### Segurança

- preço vem do banco;
- token privado só no servidor;
- chave pública pode ir ao cliente quando a SDK exigir;
- não armazenar dados completos de cartão;
- verificar assinatura do webhook;
- consultar o recurso no provedor antes de confiar no payload;
- usar chave idempotente por tentativa.

### Conciliação

Criar rotina que compara:

- pagamentos locais;
- status do provedor;
- valor bruto;
- taxa;
- valor líquido;
- data prevista;
- repasse realizado;
- reembolso;
- chargeback.

## 3. Nuvem Fiscal

### Escopo

- cadastro da empresa;
- certificado e configuração;
- emissão de NF-e;
- consulta;
- cancelamento;
- carta de correção quando aplicável;
- XML;
- DANFE;
- documentos de entrada;
- manifestação quando aplicável.

### Fluxo de saída

1. Pedido elegível.
2. Resolver estabelecimento emissor.
3. Montar itens com dados fiscais.
4. Calcular conforme configuração validada pelo contador/provedor.
5. Enviar com referência única do pedido.
6. Salvar ID externo.
7. Acompanhar autorização.
8. Salvar chave, protocolo e arquivos.
9. Disparar e-mail.

### Erros

- rejeição deve manter mensagem e código;
- permitir correção de cadastro e reprocessamento;
- impedir emissão duplicada;
- não apagar tentativa;
- cancelar apenas dentro da regra e prazo aplicáveis.

### Entrada

- importar XML manualmente no MVP;
- validar chave única;
- extrair fornecedor, itens, NCM, CFOP, quantidades e valores;
- vincular ao pedido de compra;
- registrar divergências;
- efetivar estoque somente após conferência.

## 4. Melhor Envio

### Escopo

- cotação;
- serviços;
- compra de frete;
- etiqueta;
- rastreio;
- webhook;
- logística reversa quando suportada.

### Fluxo

1. Carrinho informa origem, destino, produtos e volumes.
2. Servidor calcula dimensões e peso.
3. Provedor retorna opções.
4. Opção escolhida vira snapshot no pedido.
5. Após pagamento/fiscal, operação compra etiqueta.
6. PDF é armazenado de forma privada.
7. Código de rastreio é salvo.
8. Eventos atualizam pedido e notificam cliente.

### Regras

- não aceitar preço de frete enviado pelo frontend;
- registrar prazo e valor apresentados;
- permitir frete manual em exceção;
- separar custo real de frete e valor cobrado ao cliente.

## 5. Resend

### E-mails transacionais

- criação de conta;
- recuperação de senha pelo fluxo apropriado;
- pedido recebido;
- pagamento aprovado;
- nota fiscal disponível;
- pedido enviado;
- pedido entregue;
- cancelamento;
- reembolso;
- troca/devolução;
- ticket atualizado;
- reposição de estoque;
- carrinho abandonado quando permitido.

### Eventos

- sent;
- delivered;
- bounced;
- complained;
- opened/clicked quando adotado e juridicamente adequado.

### Boas práticas

- domínio autenticado;
- SPF, DKIM e DMARC;
- remetentes separados para transacional e marketing;
- suppression list;
- template versionado;
- fallback de texto;
- links absolutos;
- nenhum segredo no frontend.

## 6. Expo Push

- armazenar token por dispositivo;
- associar ao cliente;
- invalidar token rejeitado;
- preferências por tipo;
- não enviar conteúdo sensível na notificação;
- deep link para tela relevante;
- registrar entrega e falha.

## 7. Analytics

Eventos mínimos:

- `view_item_list`;
- `select_item`;
- `view_item`;
- `add_to_cart`;
- `remove_from_cart`;
- `view_cart`;
- `begin_checkout`;
- `add_shipping_info`;
- `add_payment_info`;
- `purchase`;
- `refund`;
- `search`;
- `sign_up`;
- `login`.

Não enviar CPF, e-mail, telefone ou endereço em analytics.

## 8. Contabilidade/ERP externo

Mesmo com sistema próprio, prepare exportações:

- XML fiscal;
- CSV de vendas;
- contas a receber;
- contas a pagar;
- estoque;
- conciliação;
- impostos;
- centro de custo.

Criar uma camada de exportação para integrar futuramente com Omie, Bling, Conta Azul ou outro ERP sem contaminar o domínio.


---

# 05 — Segurança, privacidade e LGPD

## 1. Princípio

A plataforma trata dados pessoais, financeiros, fiscais e logísticos. Segurança deve existir desde o banco e não apenas na interface.

## 2. Classificação

### Público

- catálogo;
- páginas;
- imagens públicas;
- preços publicados.

### Interno

- custos;
- margens;
- fornecedores;
- dashboards;
- regras de promoção.

### Confidencial

- clientes;
- endereços;
- pedidos;
- tickets;
- documentos fiscais;
- tokens de integração.

### Altamente restrito

- service role;
- certificados;
- chaves privadas;
- secrets de webhook;
- credenciais de produção.

## 3. RLS

Todas as tabelas no schema exposto devem ter RLS. Padrões:

- cliente lê e altera apenas seus dados permitidos;
- cliente lê apenas pedidos vinculados;
- catálogo ativo pode ser público;
- staff acessa por role/permissão;
- operações críticas usam funções security definer revisadas ou backend com service role;
- service role nunca no cliente.

## 4. Autenticação

- e-mail verificado conforme fluxo;
- senha forte;
- MFA obrigatório para admin e financeiro;
- sessões revogáveis;
- bloqueio após tentativas suspeitas;
- logs de login;
- recuperação segura;
- convite para staff, não cadastro aberto.

## 5. Autorização

Use RBAC com permissões granulares:

- `catalog.read`, `catalog.write`, `catalog.publish`;
- `orders.read`, `orders.manage`, `orders.cancel`;
- `inventory.read`, `inventory.move`, `inventory.adjust`;
- `finance.read`, `finance.reconcile`, `refunds.approve`;
- `fiscal.read`, `fiscal.issue`, `fiscal.cancel`;
- `users.manage`, `roles.manage`;
- `audit.read`.

## 6. Proteção de dados

- TLS em trânsito;
- criptografia do provedor em repouso;
- campos muito sensíveis podem usar criptografia de aplicação;
- mascaramento na UI;
- signed URLs;
- retenção definida;
- backups;
- restauração testada;
- logs sem segredos.

## 7. LGPD

Manter:

- inventário de dados;
- finalidade;
- base legal definida com jurídico;
- versão dos termos;
- registro de consentimento quando aplicável;
- canal do titular;
- exportação;
- correção;
- revogação;
- exclusão ou anonimização quando possível;
- retenção por obrigação fiscal e defesa de direitos;
- registro de incidentes.

Não usar consentimento como base para tudo. Operação de pedido e obrigações fiscais possuem finalidades próprias que devem ser avaliadas juridicamente.

## 8. Comércio eletrônico

A loja deve apresentar de modo claro:

- identificação do fornecedor;
- características do produto;
- preço total;
- despesas adicionais;
- condições de pagamento e entrega;
- atendimento facilitado;
- confirmação da contratação;
- meios para arrependimento e pós-venda.

Políticas precisam ser revisadas por jurídico.

## 9. Uploads

- validar MIME e extensão;
- limitar tamanho;
- renomear arquivo;
- não executar conteúdo;
- bucket correto;
- antivírus em evolução;
- remover metadados de imagem quando necessário;
- impedir enumeração de arquivos privados.

## 10. Webhooks e APIs

- assinatura;
- timestamp;
- prevenção de replay;
- rate limit;
- idempotência;
- allowlist quando viável;
- logs redigidos;
- resposta genérica ao atacante;
- monitoramento de falhas.

## 11. Segurança de pagamento

- tokenização do provedor;
- menor escopo PCI possível;
- nunca armazenar CVV;
- não logar payload sensível;
- 3DS quando suportado e indicado;
- revisão de fraude;
- limite de tentativas;
- vínculo entre pedido, sessão e pagamento.

## 12. Segurança do desenvolvimento

- dependabot ou equivalente;
- secret scanning;
- branch protection;
- revisão por PR;
- CI obrigatório;
- lockfile;
- atualizações regulares;
- SAST e análise de dependência em evolução;
- ambientes isolados.

## 13. Auditoria

Registrar:

- alteração de preço;
- ajuste de estoque;
- cancelamento de pedido;
- reembolso;
- emissão/cancelamento fiscal;
- alteração de permissão;
- exportação de dados;
- acesso administrativo sensível.

O log deve conter usuário, ação, entidade, ID, data, IP aproximado quando permitido, request ID e diff redigido.

## 14. Incidentes

Plano:

1. detectar;
2. conter;
3. preservar evidências;
4. avaliar impacto;
5. corrigir;
6. comunicar responsáveis;
7. avaliar notificações legais;
8. documentar lições;
9. prevenir recorrência.


---

# 06 — Roadmap de implementação

## Fase 0 — Decisões de negócio

Antes de código produtivo, definir:

- razão social e CNPJ emissor;
- regime tributário;
- estados de operação;
- depósitos;
- política de preços;
- política de frete;
- troca e devolução;
- meios de pagamento;
- transportadoras;
- domínio e remetentes;
- identidade visual;
- catálogo inicial;
- responsáveis internos.

Saída: documento de decisões aprovado.

## Fase 1 — Fundação

- monorepo;
- Next.js;
- Expo;
- packages compartilhados;
- lint, format, typecheck e tests;
- CI;
- Supabase local;
- ambientes;
- observabilidade básica;
- CLAUDE.md.

Aceite:

- build web e mobile;
- CI verde;
- nenhuma chave no repositório;
- README de setup.

## Fase 2 — Auth e RBAC

- login cliente;
- convite de staff;
- perfis;
- roles;
- permissions;
- RLS;
- MFA admin;
- audit logs.

Aceite:

- cliente não acessa admin;
- staff sem permissão recebe 403;
- testes de RLS.

## Fase 3 — Catálogo

- categorias;
- marcas;
- esportes;
- produtos;
- variantes;
- imagens;
- atributos;
- preço;
- publicação;
- importação CSV.

Aceite:

- CRUD completo;
- slugs únicos;
- SKU único;
- produto publicado aparece na loja;
- imagens otimizadas.

## Fase 4 — Estoque e compras

- depósitos;
- movimentos;
- saldo;
- reserva;
- fornecedores;
- pedidos de compra;
- recebimento;
- XML de entrada básico.

Aceite:

- todo saldo possui origem em movimentos;
- recebimento parcial;
- divergência registrada;
- reserva expira.

## Fase 5 — Loja pública

- home;
- navegação;
- busca;
- listagem;
- produto;
- SEO;
- carrinho;
- login e conta;
- endereços.

Aceite:

- responsivo;
- acessível;
- performance mínima;
- carrinho persiste;
- preço do servidor.

## Fase 6 — Checkout e pagamento

- frete;
- pedido;
- Mercado Pago sandbox;
- Pix;
- cartão;
- boleto;
- webhooks;
- reembolso;
- reconciliação inicial.

Aceite:

- duplicidade não duplica pedido/pagamento;
- retorno do frontend não aprova sozinho;
- estoque é reservado e liberado;
- testes de pagamento.

## Fase 7 — Fiscal e expedição

- Nuvem Fiscal sandbox;
- NF-e;
- XML/DANFE;
- picking;
- packing;
- Melhor Envio sandbox;
- etiqueta;
- rastreio.

Aceite:

- falha fiscal reprocessável;
- nota vinculada ao pedido;
- expedição possui rastreio;
- cliente recebe comunicação.

## Fase 8 — Financeiro

- contas a receber;
- contas a pagar;
- taxas;
- repasses;
- conciliação;
- fluxo de caixa;
- margem;
- exportações.

Aceite:

- divergências visíveis;
- reembolso refletido;
- relatórios fecham com pedidos.

## Fase 9 — App

- navegação;
- auth;
- catálogo;
- produto;
- carrinho;
- checkout;
- pedidos;
- push;
- builds internos.

Aceite:

- Android e iOS em distribuição interna;
- deep links;
- sessão segura;
- política de privacidade publicada.

## Fase 10 — Marketing e pós-venda

- cupons;
- carrinho abandonado;
- reviews;
- troca/devolução;
- tickets;
- segmentos;
- campanhas;
- analytics.

## Fase 11 — Go-live

- homologação completa;
- dados mestres;
- certificados;
- DNS;
- domínio de e-mail;
- credenciais de produção;
- testes reais controlados;
- treinamento;
- plano de rollback;
- suporte de lançamento.

## Fase 12 — Evolução

- marketplace;
- PDV;
- fidelidade;
- B2B;
- IA;
- recomendação;
- app operacional;
- multi-CD;
- OMS avançado.


---

# 07 — Operação diária

## 1. Abertura do dia

- verificar integrações;
- verificar webhooks com erro;
- verificar pagamentos pendentes fora do prazo;
- verificar documentos fiscais rejeitados;
- verificar pedidos vencendo SLA;
- verificar estoque negativo ou divergente;
- verificar filas de e-mail;
- verificar entregas atrasadas;
- verificar chargebacks.

## 2. Cadastro de produto

1. Criar produto.
2. Vincular categoria, esporte e marca.
3. Criar variantes.
4. Inserir EAN, peso e dimensões.
5. Configurar fiscal com responsável.
6. Inserir custo e preço.
7. Enviar imagens.
8. Revisar SEO e descrição.
9. Definir estoque.
10. Publicar.

Checklist de publicação:

- nome claro;
- imagem principal;
- variações completas;
- preço;
- estoque;
- peso/dimensões;
- NCM e dados fiscais;
- política de garantia;
- alt text;
- slug.

## 3. Recebimento de mercadoria

1. Localizar pedido de compra.
2. Importar XML.
3. Conferir fornecedor.
4. Conferir chave de acesso.
5. Conferir itens.
6. Conferir quantidade e custo.
7. Registrar divergência.
8. Criar recebimento.
9. Movimentar estoque.
10. Gerar conta a pagar.
11. Armazenar documentos.

## 4. Pedido de venda

1. Pedido criado.
2. Estoque reservado.
3. Pagamento processado.
4. Pagamento confirmado por webhook/consulta.
5. Fiscal solicitado.
6. Documento autorizado.
7. Picking.
8. Conferência.
9. Packing.
10. Etiqueta.
11. Expedição.
12. Rastreio.
13. Entrega.

## 5. Picking

- lista por depósito;
- ordenação por localização;
- leitura de SKU/EAN;
- bloqueio de divergência;
- quantidade confirmada;
- responsável e horário;
- exceção de falta física.

## 6. Packing

- validar itens;
- escolher embalagem;
- informar peso/dimensões reais;
- anexar documento quando aplicável;
- gerar etiqueta;
- registrar lacre opcional;
- foto opcional para itens de alto valor.

## 7. Cancelamento

Cenários:

- antes do pagamento: cancelar e liberar reserva;
- pago sem emissão: cancelar pagamento e pedido;
- pago e faturado: seguir regras fiscais e reembolso;
- enviado: tratar como devolução/recusa;
- parcial: fluxo específico e auditado.

Reembolso exige permissão e deve registrar valor, motivo e provedor.

## 8. Troca e devolução

1. Cliente solicita.
2. Validar prazo e elegibilidade.
3. Aprovar ou pedir informação.
4. Gerar reversa ou instrução.
5. Receber item.
6. Inspecionar.
7. Classificar: vendável, avariado, descarte, fornecedor.
8. Reintegrar estoque quando cabível.
9. Reembolsar, trocar ou emitir crédito.
10. Encerrar e comunicar.

## 9. Conciliação

Diária:

- pagamentos aprovados;
- taxas;
- reembolsos;
- chargebacks;
- repasses;
- divergências.

Mensal:

- vendas x fiscal;
- fiscal x contabilidade;
- estoque contábil x sistema;
- contas a pagar;
- margem;
- impostos conforme contador.

## 10. Gestão de falhas

Fila de exceções:

- pagamento sem pedido;
- pedido pago sem estoque;
- pedido pago sem nota;
- nota autorizada sem expedição;
- etiqueta sem rastreio;
- rastreio entregue e pedido aberto;
- e-mail com bounce;
- XML duplicado;
- saldo negativo.

Cada exceção deve ter dono, SLA, histórico e ação de reprocessar.

## 11. Fechamento do dia

- pedidos aprovados;
- pedidos enviados;
- pedidos atrasados;
- notas rejeitadas;
- divergências financeiras;
- divergências de estoque;
- incidentes;
- resumo executivo.

## 12. Backups e continuidade

- verificar backup automático;
- testar restauração periodicamente;
- exportar documentos fiscais conforme política;
- armazenar runbook de indisponibilidade;
- possuir modo de pausar checkout sem derrubar o site;
- possuir página de status interna.


---

# 08 — APIs, webhooks e estados

## 1. Endpoints públicos

```text
GET  /api/catalog/search
GET  /api/catalog/products/:slug
POST /api/cart
POST /api/cart/items
PATCH /api/cart/items/:id
DELETE /api/cart/items/:id
POST /api/checkout/quote
POST /api/checkout/create-order
POST /api/checkout/create-payment
GET  /api/orders/:orderNumber
POST /api/returns
```

Mesmo em endpoints públicos, usar rate limit e validação.

## 2. Endpoints administrativos

```text
POST /api/admin/products
PATCH /api/admin/products/:id
POST /api/admin/inventory/movements
POST /api/admin/purchase-orders
POST /api/admin/goods-receipts
POST /api/admin/orders/:id/status
POST /api/admin/orders/:id/refund
POST /api/admin/fiscal/:orderId/issue
POST /api/admin/shipments/:orderId/label
POST /api/admin/jobs/:id/retry
```

Todos exigem autenticação e permissão.

## 3. Webhooks

```text
POST /api/webhooks/mercado-pago
POST /api/webhooks/nuvem-fiscal
POST /api/webhooks/melhor-envio
POST /api/webhooks/resend
```

## 4. Inbox idempotente

Estrutura:

```text
provider
external_event_id
event_type
payload_hash
payload_redacted
status
attempts
received_at
processed_at
last_error
```

Restrição única em `(provider, external_event_id)`.

## 5. Outbox

Dentro da mesma transação que altera o domínio, inserir evento em `outbox_events`. Um worker publica/processa depois. Isso reduz risco de atualizar o pedido e falhar antes do e-mail ou fiscal.

## 6. Máquina de estados

Transições devem ser validadas. Exemplo:

```text
awaiting_payment -> paid
awaiting_payment -> cancelled
paid -> fiscal_pending
fiscal_pending -> fiscal_authorized
fiscal_pending -> fiscal_failed
fiscal_authorized -> picking
picking -> packed
packed -> shipped
shipped -> delivered
```

Não permitir `delivered -> picking`.

## 7. Idempotency key

Operações que criam efeito externo devem receber ou gerar chave:

```text
checkout:{cart_id}:{version}
payment:{order_id}:{attempt}
invoice:{order_id}:{document_type}
label:{shipment_id}:{package_version}
refund:{payment_id}:{refund_request_id}
```

Salvar chave e resposta.

## 8. Request ID

Todo request recebe `x-request-id`. Propagar nos logs e, quando possível, no metadata do provedor.

## 9. Retry

- erro de validação: não tentar novamente;
- 401/403: revisar credencial;
- 409: tratar idempotência/conflito;
- 429: backoff;
- 5xx/timeout: retry exponencial limitado;
- erro fiscal de regra: correção manual.

## 10. Rate limit

Aplicar em:

- login;
- recuperação;
- busca;
- cupom;
- checkout;
- criação de pagamento;
- suporte;
- upload;
- webhooks por assinatura e volume esperado.


---

# 09 — Testes e go-live

## 1. Pirâmide de testes

### Unitários

- cálculo de total;
- promoção;
- frete interno;
- transição de status;
- reserva;
- liberação;
- margem;
- mapeamento de status externo.

### Integração

- repositories;
- RLS;
- criação de pedido;
- movimento de estoque;
- webhook;
- emissão fiscal em sandbox;
- compra de etiqueta em sandbox.

### E2E

- cadastro;
- busca;
- carrinho;
- Pix;
- cartão de teste;
- boleto;
- pedido;
- admin;
- picking;
- reembolso;
- devolução.

## 2. Cenários críticos

- clique duplo em finalizar;
- webhook duplicado;
- webhook fora de ordem;
- pagamento aprovado após expiração;
- estoque acaba entre carrinho e checkout;
- cupom expira;
- frete muda;
- nota rejeitada;
- etiqueta falha;
- e-mail falha;
- cliente tenta pedido alheio;
- staff sem permissão;
- reembolso parcial;
- devolução parcial;
- pedido com múltiplos volumes.

## 3. Dados de teste

- nunca usar CPF real desnecessariamente;
- usar contas sandbox;
- separar e-mails de teste;
- marcar pedidos de homologação;
- limpar dados seguindo script seguro.

## 4. Performance

Testar:

- home;
- busca;
- listagem;
- produto;
- carrinho;
- checkout;
- admin com milhares de pedidos;
- importação de catálogo;
- webhooks em pico.

## 5. Acessibilidade

- navegação por teclado;
- foco visível;
- labels;
- contraste;
- alt text;
- mensagens de erro;
- modais;
- leitor de tela nos fluxos essenciais.

## 6. Checklist de produção

### Infra

- domínio;
- DNS;
- SSL;
- variáveis;
- ambientes isolados;
- backup;
- monitoramento;
- alertas;
- cron protegido.

### Supabase

- migrations aplicadas;
- RLS revisado;
- service role protegida;
- buckets e políticas;
- Auth URLs;
- SMTP quando aplicável;
- PITR conforme plano e necessidade.

### E-mail

- domínio verificado;
- SPF;
- DKIM;
- DMARC;
- remetentes;
- suppression;
- templates;
- webhook.

### Pagamento

- credenciais de produção;
- webhook produção;
- testes controlados;
- reembolso;
- conciliação;
- contato financeiro.

### Fiscal

- empresa configurada;
- certificado;
- série e numeração;
- regime;
- CSC para NFC-e futura;
- produtos revisados;
- contador aprova regras;
- emissão real controlada.

### Frete

- origem;
- dimensões;
- transportadoras;
- etiqueta real controlada;
- rastreio;
- reversa;
- embalagem.

### Jurídico

- termos;
- privacidade;
- cookies;
- troca/devolução;
- atendimento;
- identificação da empresa;
- preços e condições;
- consentimento de marketing.

### App

- ícones;
- splash;
- bundle IDs;
- política;
- screenshots;
- conta Apple/Google;
- build production;
- revisão de loja.

## 7. Plano de lançamento

- soft launch para equipe e convidados;
- limite de volume;
- plantão técnico;
- plantão operacional;
- canal único de incidentes;
- dashboard em tempo real;
- congelamento de mudanças não críticas;
- revisão após 24h, 72h e 7 dias.

## 8. Rollback

- preservar banco;
- rollback de aplicação por deployment anterior;
- feature flags para desligar pagamento, cupom ou integração;
- pausar checkout;
- não reverter migration destrutiva;
- scripts de compensação aprovados.


---

# 10 — Referências oficiais consultadas

Consulta realizada em 11 de julho de 2026.

## Referência funcional

- Centauro — loja, navegação, categorias, pagamentos, atendimento, marketplace e aplicativo: https://www.centauro.com.br/
- Centauro — retirada e troca em loja: https://www.centauro.com.br/sc/retire-troque-loja
- Centauro — política de troca: https://www.centauro.com.br/sc/politica-de-troca-no-site

## Stack

- Next.js App Router e Route Handlers: https://nextjs.org/docs/app
- Supabase Docs, Postgres, Auth e Storage: https://supabase.com/docs
- Supabase com Next.js: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- GitHub Actions: https://docs.github.com/actions
- Claude Code: https://docs.anthropic.com/en/docs/claude-code/overview
- Claude Code e CLAUDE.md: https://docs.anthropic.com/en/docs/claude-code/memory

## Integrações

- Resend com Next.js: https://resend.com/docs/send-with-nextjs
- Resend Webhooks: https://resend.com/docs/webhooks/introduction
- Resend Inbound: https://resend.com/docs/dashboard/receiving/introduction
- Mercado Pago Developers: https://www.mercadopago.com.br/developers/pt
- Mercado Pago Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- Nuvem Fiscal: https://dev.nuvemfiscal.com.br/docs/
- Melhor Envio API: https://docs.melhorenvio.com.br/docs/introducao-a-api
- Melhor Envio Webhooks: https://docs.melhorenvio.com.br/docs/webhooks
- Expo EAS: https://docs.expo.dev/eas/
- Expo EAS Build: https://docs.expo.dev/build/introduction/
- Expo Submit: https://docs.expo.dev/deploy/submit-to-app-stores/

## Legislação

- Lei Geral de Proteção de Dados, Lei nº 13.709/2018: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709compilado.htm
- Código de Defesa do Consumidor, Lei nº 8.078/1990: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Decreto do comércio eletrônico, Decreto nº 7.962/2013: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm

## Observação

Documentação técnica, regras fiscais, APIs e legislação podem mudar. Antes de produção, o Claude deve consultar a documentação oficial atual de cada provedor. Tributação, emissão fiscal, políticas e bases legais devem ser confirmadas com contador e jurídico.


---

# Prompts de execução


---

# Prompt mestre para Claude Code

Você está na raiz do projeto Clube da Estampa. Leia integralmente `CLAUDE.md`, `README.md` e todos os arquivos em `docs/` antes de escrever código.

Objetivo: construir uma plataforma completa de e-commerce esportivo com site Next.js, aplicativo Expo, Supabase, Vercel, GitHub, Resend, Mercado Pago, Nuvem Fiscal e Melhor Envio.

Regras de execução:

1. Faça uma auditoria do repositório atual e liste o que já existe.
2. Compare com o blueprint e identifique lacunas.
3. Monte um plano em fases, sem tentar construir tudo em um único passo.
4. Trabalhe apenas na primeira fase incompleta.
5. Antes de editar, informe arquivos a criar/alterar.
6. Use versões estáveis compatíveis e fixe dependências no lockfile.
7. Não invente credenciais nem dados fiscais.
8. Não exponha service role ou tokens privados.
9. Mantenha migrations append-only.
10. Habilite e teste RLS.
11. Implemente validação no servidor.
12. Adicione testes para regras críticas.
13. Ao final, execute lint, typecheck, testes e build.
14. Atualize documentação e checklist.
15. Pare ao concluir uma fase e entregue relatório objetivo com próximos passos.

Comece agora pela auditoria e pela Fase 1 — Fundação, salvo se ela já estiver concluída.


---

# Fase 1 — Fundação

Implemente a fundação do monorepo Clube da Estampa.

Entregas:

- pnpm workspaces;
- Turborepo;
- `apps/web` com Next.js App Router e TypeScript estrito;
- `apps/mobile` com Expo Router e TypeScript;
- packages `types`, `validation`, `integrations`, `config` e `ui`;
- Tailwind e shadcn/ui no web;
- ESLint, Prettier, typecheck, Vitest;
- Playwright preparado;
- env validation com Zod;
- `.env.example` revisado;
- CI do GitHub;
- README de desenvolvimento;
- health endpoint;
- página inicial provisória do Clube da Estampa, própria e sem copiar concorrentes.

Critérios:

- `pnpm install`, `lint`, `typecheck`, `test` e `build` passam;
- nenhum secret no código;
- estrutura documentada;
- commits sugeridos por bloco lógico.

Não implemente catálogo ou checkout ainda.


---

# Fase 2 — Auth e RBAC

Implemente autenticação e autorização.

Entregas:

- clientes Supabase browser/server;
- login, cadastro, confirmação e recuperação;
- sessão SSR;
- `profiles`, `roles`, `permissions`, `user_roles` e `role_permissions`;
- migrations;
- RLS;
- helper `requireUser`;
- helper `requirePermission`;
- área do cliente;
- layout admin protegido;
- convite de staff;
- auditoria de alterações de acesso;
- testes de RLS e autorização.

Não use apenas middleware para autorização. A permissão deve ser validada no servidor/banco.


---

# Fase 3 — Catálogo

Implemente o domínio de catálogo.

Entregas:

- esportes, categorias hierárquicas, marcas;
- produtos e variantes;
- atributos e valores;
- imagens no Supabase Storage;
- preços;
- status draft/active/archived;
- CRUD admin;
- importação CSV com preview e validação;
- páginas públicas de listagem e produto;
- slugs;
- SEO;
- busca inicial com FTS e trigram;
- testes.

Regras:

- SKU único;
- EAN único quando preenchido;
- dinheiro em centavos;
- imagem com alt text;
- produto só publica com campos mínimos;
- custos não aparecem na API pública.


---

# Fase 4 — Estoque, fornecedores e compras

Implemente:

- depósitos;
- localizações;
- saldos;
- ledger de movimentos;
- reservas com expiração;
- transferências;
- ajustes autorizados;
- fornecedores;
- pedido de compra;
- recebimento parcial;
- importação de XML de entrada com prevenção de duplicidade;
- divergências;
- telas admin;
- testes transacionais.

Regras:

- nenhum saldo muda sem movimento;
- evitar estoque negativo;
- usar transação e bloqueio apropriado;
- registrar usuário e motivo de ajuste;
- não efetivar estoque antes da conferência.


---

# Fase 5 — Storefront, carrinho e checkout base

Implemente:

- home configurável;
- menu por esporte/categoria;
- busca e filtros;
- produto;
- favoritos;
- carrinho anônimo e autenticado;
- merge após login;
- endereços;
- cálculo de totais no servidor;
- cupom base;
- cotação de frete por interface;
- criação de pedido `awaiting_payment`;
- reserva de estoque;
- confirmação visual provisória.

Não integrar pagamento real nesta fase. Use adapter fake apenas em ambiente de teste, claramente isolado e nunca como produção.


---

# Fase 6 — Mercado Pago

Implemente a integração de pagamento usando documentação oficial atual.

Entregas:

- adapter `MercadoPagoPaymentProvider`;
- Pix;
- cartão via método seguro/tokenizado;
- boleto;
- criação idempotente;
- webhook com validação;
- consulta do recurso no provedor;
- mapeamento de status;
- atualização transacional do pedido;
- liberação/consumo de reserva;
- cancelamento e reembolso;
- conciliação inicial;
- painel de pagamentos;
- testes sandbox e mocks de contrato.

Regras:

- retorno do navegador não aprova pedido;
- não armazenar dados de cartão;
- não confiar em valor do frontend;
- webhook duplicado não duplica efeitos;
- registrar external IDs e request IDs.


---

# Fase 7 — Fiscal e logística

Implemente:

## Fiscal

- adapter Nuvem Fiscal;
- emissão NF-e sandbox;
- consulta;
- cancelamento;
- armazenamento privado de XML e DANFE;
- status e rejeições;
- reprocessamento manual;
- e-mail de documento;
- tela fiscal.

## Logística

- adapter Melhor Envio;
- cotação;
- compra de etiqueta sandbox;
- armazenamento privado;
- rastreio;
- webhook;
- picking e packing;
- expedição;
- tela operacional.

Não invente NCM, CFOP, CST/CSOSN ou alíquotas. Crie validações e campos de configuração para preenchimento com contador.


---

# Fase 8 — Resend e notificações

Implemente:

- React Email;
- adapter Resend;
- fila de notificações;
- templates de pedido, pagamento, fiscal, envio, entrega, cancelamento e devolução;
- webhook de entrega, bounce e complaint;
- suppression list;
- preview local;
- registro de envio;
- retries;
- preferência de marketing separada de transacional;
- testes.

Nenhum e-mail deve ser enviado diretamente do navegador.


---

# Fase 9 — Financeiro e conciliação

Implemente:

- contas a receber;
- contas a pagar;
- parcelas;
- taxas;
- repasses;
- reembolsos;
- chargebacks;
- conciliação automática e manual;
- divergências;
- fluxo de caixa;
- margem por pedido e SKU;
- exportação CSV;
- permissões financeiras;
- auditoria;
- testes.

Valores sempre em centavos. Ajustes e baixas manuais exigem motivo e permissão.


---

# Fase 10 — Aplicativo Expo

Implemente o app do cliente com Expo Router.

Entregas:

- design system mobile baseado na identidade Clube da Estampa;
- auth;
- home;
- busca;
- categorias;
- produto;
- favoritos;
- carrinho;
- checkout;
- pedidos;
- rastreio;
- perfil e endereços;
- suporte;
- push;
- deep links;
- analytics;
- EAS config para development, preview e production;
- testes e documentação de build/submit.

Segredos privados não podem ser incluídos no bundle.


---

# Fase 11 — Homologação e go-live

Faça uma auditoria final de produção.

Entregas:

- checklist de segurança;
- RLS testado;
- secrets revisados;
- domínio e DNS;
- políticas e páginas legais;
- domínio Resend verificado;
- webhooks de produção;
- credenciais de produção isoladas;
- testes controlados de pagamento, fiscal e frete;
- backup e restauração;
- observabilidade e alertas;
- runbooks;
- plano de rollback;
- carga de catálogo;
- treinamento por perfil;
- relatório de riscos e pendências.

Não ativar produção enquanto houver falha crítica aberta.
