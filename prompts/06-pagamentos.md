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
