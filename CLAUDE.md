# CLAUDE.md — Kickoffstore

## Missão

Construir e manter a Kickoffstore como plataforma própria de comércio eletrônico esportivo, com site, aplicativo e painel operacional. O sistema deve ser seguro, auditável, responsivo, acessível, modular e preparado para crescer sem perder controle financeiro, fiscal ou de estoque.

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
