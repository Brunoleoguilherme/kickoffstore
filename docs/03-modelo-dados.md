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
