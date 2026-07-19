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
