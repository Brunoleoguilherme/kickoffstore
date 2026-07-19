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
