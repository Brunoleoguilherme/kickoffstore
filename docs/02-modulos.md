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
