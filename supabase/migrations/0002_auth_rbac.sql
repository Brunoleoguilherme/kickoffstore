-- Clube da Estampa — Auth & RBAC support (Fase 2)
-- Append-only migration. Depends on 0001_initial_schema.sql.

-- 1) System roles (global; organization_id NULL keeps them order-independent).
insert into public.roles (organization_id, code, name, description, is_system) values
  (null, 'customer',  'Cliente',    'Cliente da loja',                 true),
  (null, 'support',   'Atendimento','Suporte ao cliente',              true),
  (null, 'warehouse', 'Estoque',    'Estoque e expedição',             true),
  (null, 'catalog',   'Catálogo',   'Catálogo e conteúdo',             true),
  (null, 'finance',   'Financeiro', 'Financeiro e conciliação',        true),
  (null, 'fiscal',    'Fiscal',     'Documentos fiscais',              true),
  (null, 'manager',   'Gestão',     'Gestão operacional',              true),
  (null, 'admin',     'Administrador','Administração total',           true)
on conflict (organization_id, code) do nothing;

-- 2) Map permissions to roles. Admin gets everything.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'admin' and r.is_system
on conflict do nothing;

-- Catalog role -> catalog.* + inventory.read
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('catalog.read','catalog.write','catalog.publish','inventory.read')
where r.code = 'catalog' and r.is_system
on conflict do nothing;

-- Warehouse role -> inventory.* + orders.read
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('inventory.read','inventory.move','inventory.adjust','orders.read')
where r.code = 'warehouse' and r.is_system
on conflict do nothing;

-- Finance role -> finance.* + refunds + orders.read
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('finance.read','finance.reconcile','refunds.approve','orders.read')
where r.code = 'finance' and r.is_system
on conflict do nothing;

-- Fiscal role -> fiscal.* + orders.read
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('fiscal.read','fiscal.issue','fiscal.cancel','orders.read')
where r.code = 'fiscal' and r.is_system
on conflict do nothing;

-- Support role -> customers.read + orders.read + orders.manage
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('customers.read','orders.read','orders.manage')
where r.code = 'support' and r.is_system
on conflict do nothing;

-- 3) RPC: permissions of the current user (security definer bypasses RLS safely).
create or replace function public.current_user_permissions()
returns table(code text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct p.code
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = auth.uid();
$$;

grant execute on function public.current_user_permissions() to authenticated;

-- 4) Auto-create a profile row when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Bootstrap helper: promote an existing user (by e-mail) to a system role.
--    Run once after creating your first user, e.g.:
--      select public.grant_role_by_email('you@example.com', 'admin');
create or replace function public.grant_role_by_email(target_email text, role_code text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_role_id uuid;
begin
  select id into v_user_id from auth.users where email = target_email;
  if v_user_id is null then
    raise exception 'Usuário % não encontrado', target_email;
  end if;
  select id into v_role_id from public.roles where code = role_code and is_system;
  if v_role_id is null then
    raise exception 'Role % não encontrada', role_code;
  end if;
  insert into public.user_roles (user_id, role_id)
  values (v_user_id, v_role_id)
  on conflict do nothing;
end;
$$;

-- 6) RLS for staff-management tables (only users.manage can read/manage them).
create policy "roles manage" on public.roles
  for select using (private.has_permission('users.manage'));
create policy "permissions read" on public.permissions
  for select using (private.has_permission('users.manage'));
create policy "role_permissions read" on public.role_permissions
  for select using (private.has_permission('users.manage'));
create policy "user_roles read" on public.user_roles
  for select using (user_id = auth.uid() or private.has_permission('users.manage'));

-- Staff with users.manage may read all profiles (self-read already exists).
create policy "profiles staff read" on public.profiles
  for select using (private.has_permission('users.manage'));
