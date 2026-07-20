-- Posicionamento de produto por vitrine (loja principal ou de parceiro).
-- Permite marcar um produto como Destaque/Mais vendido em UMA loja específica.
-- partner_id NULL = loja principal (Clube da Estampa). Append-only (CLAUDE.md).

create table if not exists product_placements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  partner_id uuid references partners(id) on delete cascade,
  section text not null check (section in ('destaques','mais_vendidos')),
  created_at timestamptz not null default now()
);

create unique index if not exists uq_product_placements
  on product_placements (product_id, coalesce(partner_id, '00000000-0000-0000-0000-000000000000'::uuid), section);
create index if not exists idx_product_placements_lookup on product_placements (partner_id, section);

alter table product_placements enable row level security;
drop policy if exists product_placements_read on product_placements;
create policy product_placements_read on product_placements for select using (true);

-- Seed: loja principal a partir do home_sections atual
insert into product_placements (product_id, partner_id, section)
select p.id, null, s.section
from products p
cross join lateral unnest(p.home_sections) as s(section)
where p.show_in_main = true and s.section in ('destaques','mais_vendidos')
on conflict do nothing;

-- Seed: produtos exclusivos de cada parceiro
insert into product_placements (product_id, partner_id, section)
select p.id, p.partner_id, s.section
from products p
cross join lateral unnest(p.home_sections) as s(section)
where p.partner_id is not null and s.section in ('destaques','mais_vendidos')
on conflict do nothing;

-- Seed: produtos compartilhados com cada parceiro
insert into product_placements (product_id, partner_id, section)
select pp.product_id, pp.partner_id, s.section
from partner_products pp
join products p on p.id = pp.product_id
cross join lateral unnest(p.home_sections) as s(section)
where s.section in ('destaques','mais_vendidos')
on conflict do nothing;
