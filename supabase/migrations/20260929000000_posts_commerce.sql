-- Every plant post is also a product. Commerce fields live on `posts`;
-- localized names and descriptions stay in `post_translations`.
-- A post is sellable when status = 'published', product_status = 'active'
-- and price_vnd is set.

create type public.product_status as enum ('draft', 'active', 'archived');

alter table public.posts
  add column price_vnd integer
    constraint posts_price_vnd_non_negative check (price_vnd is null or price_vnd >= 0),
  add column stock integer not null default 0
    constraint posts_stock_non_negative check (stock >= 0),
  add column product_status public.product_status not null default 'draft';

comment on column public.posts.price_vnd is
  'Unit price in VND. NULL means the post is not for sale.';
comment on column public.posts.stock is
  'Units available. Decremented only by public.place_order().';
comment on column public.posts.product_status is
  'draft: not shown for sale; active: purchasable; archived: no longer sold.';

-- Broadcast row changes to the storefront. Realtime applies the existing
-- anon RLS policy, so only published posts are delivered.
alter publication supabase_realtime add table public.posts;
