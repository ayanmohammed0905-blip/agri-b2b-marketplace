alter table profiles enable row level security;
alter table listings enable row level security;
alter table market_prices enable row level security;
alter table orders enable row level security;

-- Profiles: your own, farmers of available listings, and people you have an order with.
create policy "profiles read" on profiles for select to authenticated using (
  id = auth.uid()
  or exists (select 1 from listings l where l.farmer_id = profiles.id and l.is_available)
  or exists (select 1 from orders o where
       (o.buyer_id = auth.uid() and o.farmer_id = profiles.id)
    or (o.farmer_id = auth.uid() and o.buyer_id = profiles.id))
);
create policy "profiles insert own" on profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles update own" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Listings: everyone signed in sees available ones; farmers manage their own.
create policy "listings read" on listings for select to authenticated
  using (is_available or farmer_id = auth.uid());
create policy "listings insert own" on listings for insert to authenticated
  with check (farmer_id = auth.uid());
create policy "listings update own" on listings for update to authenticated
  using (farmer_id = auth.uid()) with check (farmer_id = auth.uid());
create policy "listings delete own" on listings for delete to authenticated
  using (farmer_id = auth.uid());

-- Market prices: read only.
create policy "prices read" on market_prices for select using (true);

-- Orders: only the buyer and farmer can read. No insert or update policy on purpose:
-- orders change only through place_order and update_order_status.
create policy "orders read own" on orders for select to authenticated
  using (buyer_id = auth.uid() or farmer_id = auth.uid());

-- ILLUSTRATIVE SAMPLE PRICES (not real market data). Replace with AGMARKNET later.
insert into market_prices (crop, min_price, max_price, market, reported_on, source, is_sample) values
  ('Tomato', 18, 24, 'Bengaluru (sample)', '2026-11-18', 'Illustrative sample data', true),
  ('Onion',  24, 32, 'Bengaluru (sample)', '2026-11-18', 'Illustrative sample data', true),
  ('Potato', 20, 28, 'Bengaluru (sample)', '2026-11-18', 'Illustrative sample data', true),
  ('Carrot', 30, 40, 'Bengaluru (sample)', '2026-11-18', 'Illustrative sample data', true),
  ('Beans',  40, 52, 'Bengaluru (sample)', '2026-11-18', 'Illustrative sample data', true);
