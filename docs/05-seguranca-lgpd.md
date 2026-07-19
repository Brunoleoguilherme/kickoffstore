# 05 — Segurança, privacidade e LGPD

## 1. Princípio

A plataforma trata dados pessoais, financeiros, fiscais e logísticos. Segurança deve existir desde o banco e não apenas na interface.

## 2. Classificação

### Público

- catálogo;
- páginas;
- imagens públicas;
- preços publicados.

### Interno

- custos;
- margens;
- fornecedores;
- dashboards;
- regras de promoção.

### Confidencial

- clientes;
- endereços;
- pedidos;
- tickets;
- documentos fiscais;
- tokens de integração.

### Altamente restrito

- service role;
- certificados;
- chaves privadas;
- secrets de webhook;
- credenciais de produção.

## 3. RLS

Todas as tabelas no schema exposto devem ter RLS. Padrões:

- cliente lê e altera apenas seus dados permitidos;
- cliente lê apenas pedidos vinculados;
- catálogo ativo pode ser público;
- staff acessa por role/permissão;
- operações críticas usam funções security definer revisadas ou backend com service role;
- service role nunca no cliente.

## 4. Autenticação

- e-mail verificado conforme fluxo;
- senha forte;
- MFA obrigatório para admin e financeiro;
- sessões revogáveis;
- bloqueio após tentativas suspeitas;
- logs de login;
- recuperação segura;
- convite para staff, não cadastro aberto.

## 5. Autorização

Use RBAC com permissões granulares:

- `catalog.read`, `catalog.write`, `catalog.publish`;
- `orders.read`, `orders.manage`, `orders.cancel`;
- `inventory.read`, `inventory.move`, `inventory.adjust`;
- `finance.read`, `finance.reconcile`, `refunds.approve`;
- `fiscal.read`, `fiscal.issue`, `fiscal.cancel`;
- `users.manage`, `roles.manage`;
- `audit.read`.

## 6. Proteção de dados

- TLS em trânsito;
- criptografia do provedor em repouso;
- campos muito sensíveis podem usar criptografia de aplicação;
- mascaramento na UI;
- signed URLs;
- retenção definida;
- backups;
- restauração testada;
- logs sem segredos.

## 7. LGPD

Manter:

- inventário de dados;
- finalidade;
- base legal definida com jurídico;
- versão dos termos;
- registro de consentimento quando aplicável;
- canal do titular;
- exportação;
- correção;
- revogação;
- exclusão ou anonimização quando possível;
- retenção por obrigação fiscal e defesa de direitos;
- registro de incidentes.

Não usar consentimento como base para tudo. Operação de pedido e obrigações fiscais possuem finalidades próprias que devem ser avaliadas juridicamente.

## 8. Comércio eletrônico

A loja deve apresentar de modo claro:

- identificação do fornecedor;
- características do produto;
- preço total;
- despesas adicionais;
- condições de pagamento e entrega;
- atendimento facilitado;
- confirmação da contratação;
- meios para arrependimento e pós-venda.

Políticas precisam ser revisadas por jurídico.

## 9. Uploads

- validar MIME e extensão;
- limitar tamanho;
- renomear arquivo;
- não executar conteúdo;
- bucket correto;
- antivírus em evolução;
- remover metadados de imagem quando necessário;
- impedir enumeração de arquivos privados.

## 10. Webhooks e APIs

- assinatura;
- timestamp;
- prevenção de replay;
- rate limit;
- idempotência;
- allowlist quando viável;
- logs redigidos;
- resposta genérica ao atacante;
- monitoramento de falhas.

## 11. Segurança de pagamento

- tokenização do provedor;
- menor escopo PCI possível;
- nunca armazenar CVV;
- não logar payload sensível;
- 3DS quando suportado e indicado;
- revisão de fraude;
- limite de tentativas;
- vínculo entre pedido, sessão e pagamento.

## 12. Segurança do desenvolvimento

- dependabot ou equivalente;
- secret scanning;
- branch protection;
- revisão por PR;
- CI obrigatório;
- lockfile;
- atualizações regulares;
- SAST e análise de dependência em evolução;
- ambientes isolados.

## 13. Auditoria

Registrar:

- alteração de preço;
- ajuste de estoque;
- cancelamento de pedido;
- reembolso;
- emissão/cancelamento fiscal;
- alteração de permissão;
- exportação de dados;
- acesso administrativo sensível.

O log deve conter usuário, ação, entidade, ID, data, IP aproximado quando permitido, request ID e diff redigido.

## 14. Incidentes

Plano:

1. detectar;
2. conter;
3. preservar evidências;
4. avaliar impacto;
5. corrigir;
6. comunicar responsáveis;
7. avaliar notificações legais;
8. documentar lições;
9. prevenir recorrência.
