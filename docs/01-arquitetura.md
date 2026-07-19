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
