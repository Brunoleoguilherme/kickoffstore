-- Ordem (posição) dos produtos em cada seção da vitrine. Menor = primeiro.
alter table product_placements add column if not exists position integer not null default 0;
create index if not exists idx_product_placements_order on product_placements (partner_id, section, position);
