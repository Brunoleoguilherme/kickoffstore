-- Clube da Estampa MVP schema
-- Review fiscal fields and business rules with accounting/legal professionals before production.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create schema if not exists private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  slug text not null unique,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  code text not null,
  unit_type text not null check (unit_type in ('headquarters','branch','warehouse','store','office')),
  tax_id text,
  address jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  full_name text,
  phone text,
  avatar_path text,
  status text not null default 'active' check (status in ('active','blocked','invited')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  code text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create or replace function private.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.code = permission_code
  );
$$;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  tax_id_encrypted text,
  status text not null default 'active' check (status in ('active','blocked','anonymized')),
  source text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  recipient_name text not null,
  postal_code text not null,
  street text not null,
  number text not null,
  complement text,
  district text,
  city text not null,
  state text not null,
  country text not null default 'BR',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  consent_type text not null,
  version text not null,
  granted boolean not null,
  source text,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.sports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  slug text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  image_path text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  slug text not null,
  logo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  brand_id uuid references public.brands(id),
  primary_category_id uuid references public.categories(id),
  sport_id uuid references public.sports(id),
  name text not null,
  slug text not null,
  short_description text,
  description text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  gender text check (gender in ('male','female','unisex','kids')),
  seo_title text,
  seo_description text,
  search_text tsvector generated always as (
    to_tsvector('portuguese', coalesce(name,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(description,''))
  ) stored,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index products_search_idx on public.products using gin(search_text);
create index products_name_trgm_idx on public.products using gin(name gin_trgm_ops);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  ean text unique,
  name text,
  color text,
  size text,
  cost_cents bigint not null default 0 check (cost_cents >= 0),
  price_cents bigint not null check (price_cents >= 0),
  compare_at_price_cents bigint check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  weight_grams integer not null default 0 check (weight_grams >= 0),
  length_cm numeric(10,2) not null default 0,
  width_cm numeric(10,2) not null default 0,
  height_cm numeric(10,2) not null default 0,
  ncm text,
  cest text,
  fiscal_origin text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid references public.organization_units(id),
  name text not null,
  code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.inventory_balances (
  warehouse_id uuid not null references public.warehouses(id),
  variant_id uuid not null references public.product_variants(id),
  on_hand numeric(14,3) not null default 0,
  reserved numeric(14,3) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (warehouse_id, variant_id),
  check (on_hand >= 0),
  check (reserved >= 0),
  check (reserved <= on_hand)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  warehouse_id uuid not null references public.warehouses(id),
  variant_id uuid not null references public.product_variants(id),
  movement_type text not null check (movement_type in ('purchase_receipt','sale','return','adjustment_in','adjustment_out','transfer_in','transfer_out','damage')),
  quantity numeric(14,3) not null check (quantity > 0),
  reference_type text,
  reference_id uuid,
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  warehouse_id uuid not null references public.warehouses(id),
  variant_id uuid not null references public.product_variants(id),
  cart_id uuid,
  order_id uuid,
  quantity numeric(14,3) not null check (quantity > 0),
  status text not null default 'active' check (status in ('active','committed','released','expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_reservations_expiry_idx on public.inventory_reservations(status, expires_at);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  legal_name text not null,
  trade_name text,
  tax_id text,
  email text,
  phone text,
  address jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  supplier_id uuid not null references public.suppliers(id),
  warehouse_id uuid not null references public.warehouses(id),
  po_number text not null,
  status text not null default 'draft' check (status in ('draft','approved','sent','partially_received','received','cancelled')),
  expected_at date,
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  freight_cents bigint not null default 0,
  total_cents bigint not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, po_number)
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  ordered_quantity numeric(14,3) not null check (ordered_quantity > 0),
  received_quantity numeric(14,3) not null default 0,
  unit_cost_cents bigint not null check (unit_cost_cents >= 0),
  total_cents bigint not null check (total_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  purchase_order_id uuid references public.purchase_orders(id),
  warehouse_id uuid not null references public.warehouses(id),
  receipt_number text not null,
  status text not null default 'draft' check (status in ('draft','in_review','completed','cancelled')),
  received_at timestamptz,
  received_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, receipt_number)
);

create table public.incoming_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  supplier_id uuid references public.suppliers(id),
  goods_receipt_id uuid references public.goods_receipts(id),
  access_key text not null unique,
  invoice_number text,
  series text,
  issued_at timestamptz,
  total_cents bigint,
  xml_storage_path text not null,
  status text not null default 'imported' check (status in ('imported','matched','divergent','accepted','rejected')),
  raw_summary jsonb,
  created_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  customer_id uuid references public.customers(id) on delete cascade,
  anonymous_token uuid unique,
  status text not null default 'active' check (status in ('active','converted','abandoned','expired')),
  currency text not null default 'BRL',
  version integer not null default 1,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  customer_id uuid references public.customers(id),
  cart_id uuid references public.carts(id),
  order_number text not null,
  channel text not null default 'web' check (channel in ('web','mobile','admin','pos','marketplace')),
  status text not null default 'awaiting_payment',
  currency text not null default 'BRL',
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  shipping_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  total_cents bigint not null default 0,
  shipping_address jsonb not null,
  billing_address jsonb,
  customer_snapshot jsonb not null,
  shipping_method_snapshot jsonb,
  coupon_snapshot jsonb,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, order_number)
);

create index orders_customer_created_idx on public.orders(customer_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  variant_id uuid references public.product_variants(id),
  sku text not null,
  product_name text not null,
  variant_name text,
  quantity integer not null check (quantity > 0),
  unit_price_cents bigint not null,
  discount_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  total_cents bigint not null,
  cost_cents bigint,
  fiscal_snapshot jsonb,
  created_at timestamptz not null default now()
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  actor_user_id uuid references public.profiles(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  order_id uuid not null references public.orders(id),
  provider text not null,
  method text not null check (method in ('pix','credit_card','debit_card','boleto','store_credit','other')),
  status text not null default 'pending',
  amount_cents bigint not null check (amount_cents >= 0),
  external_id text,
  idempotency_key text not null unique,
  provider_metadata jsonb,
  expires_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on public.payments(order_id);
create index payments_external_idx on public.payments(provider, external_id);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'pending',
  reason text not null,
  external_id text,
  idempotency_key text not null unique,
  requested_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  order_id uuid references public.orders(id),
  document_type text not null check (document_type in ('nfe','nfce','nfse','incoming_nfe')),
  status text not null default 'pending',
  external_id text,
  idempotency_key text not null unique,
  access_key text unique,
  number text,
  series text,
  protocol text,
  xml_storage_path text,
  pdf_storage_path text,
  rejection_code text,
  rejection_message text,
  issued_at timestamptz,
  authorized_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  order_id uuid not null references public.orders(id),
  warehouse_id uuid not null references public.warehouses(id),
  provider text,
  service_code text,
  service_name text,
  status text not null default 'pending',
  external_id text,
  tracking_code text,
  label_storage_path text,
  charged_to_customer_cents bigint not null default 0,
  actual_cost_cents bigint,
  estimated_delivery_date date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  external_event_id text,
  status text not null,
  description text,
  location text,
  occurred_at timestamptz not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (shipment_id, external_event_id)
);

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  order_id uuid not null references public.orders(id),
  customer_id uuid references public.customers(id),
  return_number text not null,
  return_type text not null check (return_type in ('return','exchange','warranty')),
  status text not null default 'requested',
  reason text not null,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  received_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, return_number)
);

create table public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id),
  quantity integer not null check (quantity > 0),
  condition text,
  resolution text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  channel text not null check (channel in ('email','push','sms')),
  template_code text not null,
  recipient text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0,
  run_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_jobs_process_idx on public.notification_jobs(status, run_after);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.notification_jobs(id) on delete cascade,
  provider text not null,
  external_id text,
  status text not null,
  event_type text,
  occurred_at timestamptz not null default now(),
  metadata jsonb
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  event_type text,
  payload_hash text,
  payload_redacted jsonb,
  status text not null default 'received' check (status in ('received','processing','processed','failed','ignored')),
  attempts integer not null default 0,
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, external_event_id)
);

create table public.job_queue (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','dead')),
  priority integer not null default 100,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_queue_process_idx on public.job_queue(status, priority, run_after);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  actor_user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  request_id text,
  ip_hash text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger organization_units_set_updated_at before update on public.organization_units for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger customer_addresses_set_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
create trigger sports_set_updated_at before update on public.sports for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger brands_set_updated_at before update on public.brands for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger warehouses_set_updated_at before update on public.warehouses for each row execute function public.set_updated_at();
create trigger purchase_orders_set_updated_at before update on public.purchase_orders for each row execute function public.set_updated_at();
create trigger goods_receipts_set_updated_at before update on public.goods_receipts for each row execute function public.set_updated_at();
create trigger carts_set_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger refunds_set_updated_at before update on public.refunds for each row execute function public.set_updated_at();
create trigger fiscal_documents_set_updated_at before update on public.fiscal_documents for each row execute function public.set_updated_at();
create trigger shipments_set_updated_at before update on public.shipments for each row execute function public.set_updated_at();
create trigger returns_set_updated_at before update on public.returns for each row execute function public.set_updated_at();
create trigger notification_jobs_set_updated_at before update on public.notification_jobs for each row execute function public.set_updated_at();
create trigger job_queue_set_updated_at before update on public.job_queue for each row execute function public.set_updated_at();

-- RLS
alter table public.organizations enable row level security;
alter table public.organization_units enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.consent_logs enable row level security;
alter table public.sports enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.warehouses enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.goods_receipts enable row level security;
alter table public.incoming_invoices enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.fiscal_documents enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.webhook_events enable row level security;
alter table public.job_queue enable row level security;
alter table public.audit_logs enable row level security;

-- Public catalog read
create policy "public read active sports" on public.sports for select using (active = true);
create policy "public read active categories" on public.categories for select using (active = true);
create policy "public read active brands" on public.brands for select using (active = true);
create policy "public read active products" on public.products for select using (status = 'active');
create policy "public read active variants" on public.product_variants for select using (
  active = true and exists (
    select 1 from public.products p where p.id = product_id and p.status = 'active'
  )
);
create policy "public read product images" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
);

-- Profile/customer self access
create policy "profile self read" on public.profiles for select using (id = auth.uid() or private.has_permission('users.manage'));
create policy "profile self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "customer self read" on public.customers for select using (user_id = auth.uid() or private.has_permission('customers.read'));
create policy "customer self update" on public.customers for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "address self manage" on public.customer_addresses for all using (
  exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
) with check (
  exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
);

create policy "customer orders read" on public.orders for select using (
  exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid())
  or private.has_permission('orders.read')
);

create policy "customer order items read" on public.order_items for select using (
  exists (
    select 1 from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = order_id and c.user_id = auth.uid()
  ) or private.has_permission('orders.read')
);

create policy "customer shipments read" on public.shipments for select using (
  exists (
    select 1 from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = order_id and c.user_id = auth.uid()
  ) or private.has_permission('orders.read')
);

create policy "customer shipment events read" on public.shipment_events for select using (
  exists (
    select 1 from public.shipments s
    join public.orders o on o.id = s.order_id
    join public.customers c on c.id = o.customer_id
    where s.id = shipment_id and c.user_id = auth.uid()
  ) or private.has_permission('orders.read')
);

-- Staff examples
create policy "catalog staff manage products" on public.products for all using (private.has_permission('catalog.write')) with check (private.has_permission('catalog.write'));
create policy "catalog staff manage variants" on public.product_variants for all using (private.has_permission('catalog.write')) with check (private.has_permission('catalog.write'));
create policy "inventory staff read balances" on public.inventory_balances for select using (private.has_permission('inventory.read'));
create policy "finance staff read payments" on public.payments for select using (private.has_permission('finance.read'));
create policy "fiscal staff read documents" on public.fiscal_documents for select using (private.has_permission('fiscal.read'));
create policy "audit staff read logs" on public.audit_logs for select using (private.has_permission('audit.read'));

-- Most writes to orders/payments/fiscal/inventory are expected through server-side service role
-- or carefully reviewed security-definer RPCs. Add granular policies in later migrations.
