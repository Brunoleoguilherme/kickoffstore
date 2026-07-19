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
