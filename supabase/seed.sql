-- Development-only seed. Do not use real personal or fiscal data.

insert into public.organizations (id, name, legal_name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Clube da Estampa', 'Clube da Estampa (razão social a definir)', 'clubedaestampa')
on conflict do nothing;

insert into public.permissions (code, name) values
  ('users.manage', 'Gerenciar usuários'),
  ('customers.read', 'Consultar clientes'),
  ('catalog.read', 'Consultar catálogo'),
  ('catalog.write', 'Editar catálogo'),
  ('catalog.publish', 'Publicar catálogo'),
  ('inventory.read', 'Consultar estoque'),
  ('inventory.move', 'Movimentar estoque'),
  ('inventory.adjust', 'Ajustar estoque'),
  ('orders.read', 'Consultar pedidos'),
  ('orders.manage', 'Gerenciar pedidos'),
  ('finance.read', 'Consultar financeiro'),
  ('finance.reconcile', 'Conciliar financeiro'),
  ('refunds.approve', 'Aprovar reembolsos'),
  ('fiscal.read', 'Consultar fiscal'),
  ('fiscal.issue', 'Emitir documentos fiscais'),
  ('fiscal.cancel', 'Cancelar documentos fiscais'),
  ('audit.read', 'Consultar auditoria')
on conflict (code) do nothing;

insert into public.sports (organization_id, name, slug, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Futebol', 'futebol', 10),
  ('00000000-0000-0000-0000-000000000001', 'Futebol Americano', 'futebol-americano', 20),
  ('00000000-0000-0000-0000-000000000001', 'Flag Football', 'flag-football', 30),
  ('00000000-0000-0000-0000-000000000001', 'Corrida', 'corrida', 40),
  ('00000000-0000-0000-0000-000000000001', 'Basquete', 'basquete', 50),
  ('00000000-0000-0000-0000-000000000001', 'Academia e Fitness', 'academia-fitness', 60)
on conflict do nothing;

insert into public.categories (organization_id, name, slug, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Calçados', 'calcados', 10),
  ('00000000-0000-0000-0000-000000000001', 'Roupas', 'roupas', 20),
  ('00000000-0000-0000-0000-000000000001', 'Equipamentos', 'equipamentos', 30),
  ('00000000-0000-0000-0000-000000000001', 'Acessórios', 'acessorios', 40)
on conflict do nothing;
