-- Orders change only through these functions, so a buyer cannot set their own price
-- and stock cannot go negative when two orders arrive together.

create or replace function place_order(p_listing_id uuid, p_quantity numeric)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
  v_listing listings;
  v_order orders;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is distinct from 'buyer' then
    raise exception 'Only buyers can place orders';
  end if;

  select * into v_listing from listings where id = p_listing_id;
  if not found or not v_listing.is_available then
    raise exception 'Listing not found';
  end if;
  if p_quantity <= 0 then
    raise exception 'Quantity must be more than zero';
  end if;
  if p_quantity > v_listing.quantity then
    raise exception 'Not enough stock available';
  end if;

  insert into orders (listing_id, buyer_id, farmer_id, quantity, agreed_price)
  values (v_listing.id, auth.uid(), v_listing.farmer_id, p_quantity, v_listing.asking_price)
  returning * into v_order;
  return v_order;
end $$;

create or replace function update_order_status(p_order_id uuid, p_next order_status)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders;
  v_listing listings;
  v_actor uuid := auth.uid();
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_actor is null or v_actor not in (v_order.buyer_id, v_order.farmer_id) then
    raise exception 'Not allowed';
  end if;

  if not (
    (v_order.status = 'requested' and p_next in ('accepted', 'rejected')) or
    (v_order.status = 'accepted' and p_next = 'pickup_scheduled') or
    (v_order.status = 'pickup_scheduled' and p_next = 'picked_up') or
    (v_order.status = 'picked_up' and p_next = 'in_transit') or
    (v_order.status = 'in_transit' and p_next = 'delivered') or
    (v_order.status = 'delivered' and p_next = 'confirmed')
  ) then
    raise exception 'Cannot change status from % to %', v_order.status, p_next;
  end if;

  if p_next = 'confirmed' then
    if v_actor <> v_order.buyer_id then
      raise exception 'Only the buyer can confirm receipt';
    end if;
  elsif v_actor <> v_order.farmer_id then
    raise exception 'Only the farmer can do this step';
  end if;

  if p_next = 'accepted' then
    select * into v_listing from listings where id = v_order.listing_id for update;
    if v_listing.quantity < v_order.quantity then
      raise exception 'Not enough stock to accept this order';
    end if;
    update listings
      set quantity = quantity - v_order.quantity,
          is_available = (quantity - v_order.quantity) > 0
      where id = v_listing.id;
  end if;

  update orders set status = p_next, updated_at = now()
    where id = p_order_id returning * into v_order;
  return v_order;
end $$;

grant execute on function place_order(uuid, numeric) to authenticated;
grant execute on function update_order_status(uuid, order_status) to authenticated;

