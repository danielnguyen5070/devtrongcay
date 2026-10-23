-- Admin dashboard access via JWT app_metadata.role = 'admin'.
-- Storefront anon policies unchanged; service_role place_order / RAG untouched.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- post_reviews: admins see all statuses and can update (approve / reject)
-- ---------------------------------------------------------------------------

grant select, update on table public.post_reviews to authenticated;

create policy "Admins can read all reviews"
  on public.post_reviews
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update reviews"
  on public.post_reviews
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders / order_items: admins read; update status on orders only
-- ---------------------------------------------------------------------------

grant select, update on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

create policy "Admins can read orders"
  on public.orders
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update orders"
  on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can read order items"
  on public.order_items
  for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- posts / translations: admin SELECT (incl. drafts) for review/order labels
-- ---------------------------------------------------------------------------

create policy "Admins can read all posts"
  on public.posts
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can read all post translations"
  on public.post_translations
  for select
  to authenticated
  using (public.is_admin());
