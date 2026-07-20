-- Clube da Estampa — Catalog search & public-safety (Fase 3)
-- Append-only migration. Depends on 0001 and 0002.

-- 1) Protect cost from the public/data API (CLAUDE.md: "custos não aparecem na API pública").
--    Cost is readable only via trusted server code (service role). Admin screens
--    that need cost must fetch it through a server action using the service role.
revoke select (cost_cents) on public.product_variants from anon;
revoke select (cost_cents) on public.product_variants from authenticated;

-- 2) Full-text + trigram search over active products (RLS still applies).
create or replace function public.search_products(
  q text default null,
  limit_count integer default 24,
  offset_count integer default 0
)
returns setof public.products
language sql
stable
as $$
  select p.*
  from public.products p
  where p.status = 'active'
    and (
      q is null
      or q = ''
      or p.search_text @@ websearch_to_tsquery('portuguese', q)
      or p.name ilike '%' || q || '%'
    )
  order by
    case when q is null or q = '' then 0
         else ts_rank(p.search_text, websearch_to_tsquery('portuguese', coalesce(q,''))) end desc,
    p.published_at desc nulls last,
    p.created_at desc
  limit greatest(least(limit_count, 100), 1)
  offset greatest(offset_count, 0);
$$;

grant execute on function public.search_products(text, integer, integer) to anon, authenticated;

-- 3) Log searches that return nothing (docs/02: "registro de termos sem resultado").
create table if not exists public.search_no_results (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  results_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.search_no_results enable row level security;
-- Only staff may read; inserts happen via server (service role).
create policy "search_no_results staff read" on public.search_no_results
  for select using (private.has_permission('catalog.read'));

-- 4) Helpful index for slug lookups already exists (unique). Add trigram on categories/brands names.
create index if not exists categories_name_trgm_idx on public.categories using gin (name gin_trgm_ops);
create index if not exists brands_name_trgm_idx on public.brands using gin (name gin_trgm_ops);

-- 5) Staff with catalog.read may view ALL products/variants/images (incl. drafts).
create policy "catalog staff read products" on public.products
  for select using (private.has_permission('catalog.read'));
create policy "catalog staff read variants" on public.product_variants
  for select using (private.has_permission('catalog.read'));
create policy "catalog staff read images" on public.product_images
  for select using (private.has_permission('catalog.read'));
create policy "catalog staff read categories" on public.categories
  for select using (private.has_permission('catalog.read'));
create policy "catalog staff read brands" on public.brands
  for select using (private.has_permission('catalog.read'));
create policy "catalog staff read sports" on public.sports
  for select using (private.has_permission('catalog.read'));
