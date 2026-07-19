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
