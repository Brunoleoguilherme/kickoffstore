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
