-- Table privileges for the API roles. RLS policies still decide which rows are visible.
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select on public.orders to authenticated;
grant select on public.market_prices to anon, authenticated;
grant execute on function public.place_order(uuid, numeric) to authenticated;
grant execute on function public.update_order_status(uuid, order_status) to authenticated;
