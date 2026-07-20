-- Merchandising manual: seções da home + visibilidade na loja principal.
-- Append-only (CLAUDE.md).

-- 1) Seções da home que o produto ocupa. Valores usados pela aplicação:
--    'destaques'    -> Lançamentos (loja principal) / Destaques (loja de parceiro)
--    'mais_vendidos'-> Mais vendidos
alter table products
  add column if not exists home_sections text[] not null default '{}'::text[];

-- 2) Visibilidade explícita na loja principal (clubedaestampa).
--    Antes era derivada de partner_id IS NULL; agora é um flag próprio.
alter table products
  add column if not exists show_in_main boolean not null default true;

-- Produtos que pertencem a um parceiro não aparecem na loja principal por padrão.
update products set show_in_main = false where partner_id is not null;

-- 3) Seed para preservar a home atual: marca os produtos ativos mais recentes
--    nas duas seções (a home hoje mostra as fatias mais novas).
update products
  set home_sections = array['destaques','mais_vendidos']::text[]
where status = 'active'
  and id in (
    select id from products where status = 'active'
    order by published_at desc nulls last
    limit 20
  );

create index if not exists idx_products_home_sections on products using gin (home_sections);
