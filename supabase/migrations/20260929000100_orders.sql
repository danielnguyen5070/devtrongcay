-- Guest orders placed from the storefront. Only the server (service role)
-- reads or writes these tables; public roles have no access.

create type public.order_status as enum (
  'pending',
  'confirmed',
  'shipping',
  'completed',
  'cancelled'
);

create type public.payment_method as enum ('cod', 'bank_transfer');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status public.order_status not null default 'pending',
  customer_name text not null
    constraint orders_customer_name_length check (char_length(btrim(customer_name)) between 1 and 120),
  phone text not null
    constraint orders_phone_format check (phone ~ '^\+?[0-9]{9,15}$'),
  address text not null
    constraint orders_address_length check (char_length(btrim(address)) between 1 and 500),
  note text not null default ''
    constraint orders_note_length check (char_length(note) <= 1000),
  payment_method public.payment_method not null,
  locale public.app_locale not null,
  subtotal_vnd integer not null constraint orders_subtotal_non_negative check (subtotal_vnd >= 0),
  shipping_fee_vnd integer not null constraint orders_shipping_non_negative check (shipping_fee_vnd >= 0),
  total_vnd integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches check (total_vnd = subtotal_vnd + shipping_fee_vnd)
);

create index orders_created_at_idx on public.orders (created_at desc);

-- product_name and unit_price_vnd are snapshots, so later edits to the post
-- never change a past order.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  product_name text not null
    constraint order_items_product_name_not_blank check (btrim(product_name) <> ''),
  unit_price_vnd integer not null constraint order_items_unit_price_non_negative check (unit_price_vnd >= 0),
  quantity integer not null constraint order_items_quantity_range check (quantity between 1 and 10),
  line_total_vnd integer not null,
  constraint order_items_line_total_matches check (line_total_vnd = unit_price_vnd * quantity)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_post_id_idx on public.order_items (post_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

revoke all on table public.orders, public.order_items from anon, authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ---------------------------------------------------------------------------
-- place_order: lock, re-verify, decrement stock and insert the order in one
-- transaction. Prices and totals are computed by the server (lib/pricing.ts);
-- this function only checks they still match the locked rows, so pricing
-- rules live in one place.
--
-- p_customer: { customer_name, phone, address, note, payment_method, locale }
-- p_lines:    [{ post_id, product_name, unit_price_vnd, quantity }]
-- Raises: empty_cart, invalid_lines, unavailable, insufficient_stock,
--         price_changed, totals_mismatch (DETAIL holds the post id).
-- ---------------------------------------------------------------------------

create function public.place_order(
  p_customer jsonb,
  p_lines jsonb,
  p_subtotal_vnd integer,
  p_shipping_fee_vnd integer,
  p_total_vnd integer
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_line record;
  v_post record;
  v_subtotal integer := 0;
  v_order_id uuid;
  v_code text;
begin
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'empty_cart';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_lines)
      as l (post_id uuid, product_name text, unit_price_vnd integer, quantity integer)
    where l.post_id is null
      or l.product_name is null
      or l.unit_price_vnd is null
      or l.quantity is null
      or l.quantity not between 1 and 10
  ) or (
    select count(distinct l.post_id) <> count(*)
    from jsonb_to_recordset(p_lines) as l (post_id uuid)
  ) then
    raise exception 'invalid_lines';
  end if;

  -- Fixed lock order so concurrent checkouts cannot deadlock.
  perform 1
  from public.posts
  where id in (select l.post_id from jsonb_to_recordset(p_lines) as l (post_id uuid))
  order by id
  for update;

  for v_line in
    select *
    from jsonb_to_recordset(p_lines)
      as l (post_id uuid, product_name text, unit_price_vnd integer, quantity integer)
  loop
    select p.status, p.product_status, p.price_vnd, p.stock
    into v_post
    from public.posts p
    where p.id = v_line.post_id;

    if not found
      or v_post.status <> 'published'
      or v_post.product_status <> 'active'
      or v_post.price_vnd is null then
      raise exception 'unavailable' using detail = v_line.post_id::text;
    end if;

    if v_post.stock < v_line.quantity then
      raise exception 'insufficient_stock' using detail = v_line.post_id::text;
    end if;

    if v_post.price_vnd <> v_line.unit_price_vnd then
      raise exception 'price_changed' using detail = v_line.post_id::text;
    end if;

    v_subtotal := v_subtotal + v_line.unit_price_vnd * v_line.quantity;
  end loop;

  if v_subtotal <> p_subtotal_vnd or p_total_vnd <> p_subtotal_vnd + p_shipping_fee_vnd then
    raise exception 'totals_mismatch';
  end if;

  update public.posts p
  set stock = p.stock - l.quantity
  from jsonb_to_recordset(p_lines) as l (post_id uuid, quantity integer)
  where p.id = l.post_id;

  loop
    v_code := 'DTC-'
      || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMMDD')
      || '-'
      || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    begin
      insert into public.orders (
        code, customer_name, phone, address, note, payment_method, locale,
        subtotal_vnd, shipping_fee_vnd, total_vnd
      )
      values (
        v_code,
        btrim(p_customer ->> 'customer_name'),
        p_customer ->> 'phone',
        btrim(p_customer ->> 'address'),
        coalesce(btrim(p_customer ->> 'note'), ''),
        (p_customer ->> 'payment_method')::public.payment_method,
        (p_customer ->> 'locale')::public.app_locale,
        p_subtotal_vnd,
        p_shipping_fee_vnd,
        p_total_vnd
      )
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      -- Order code collision; try another one.
    end;
  end loop;

  insert into public.order_items (
    order_id, post_id, product_name, unit_price_vnd, quantity, line_total_vnd
  )
  select v_order_id, l.post_id, btrim(l.product_name), l.unit_price_vnd, l.quantity,
    l.unit_price_vnd * l.quantity
  from jsonb_to_recordset(p_lines)
    as l (post_id uuid, product_name text, unit_price_vnd integer, quantity integer);

  return v_code;
end;
$$;

revoke execute on function public.place_order(jsonb, jsonb, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, integer, integer, integer)
  to service_role;
