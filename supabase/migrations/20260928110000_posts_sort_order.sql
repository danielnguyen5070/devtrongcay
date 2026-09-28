-- Manual display order for posts, edited in the Supabase Dashboard.
-- Lower numbers come first; ties fall back to newest first.

alter table public.posts
  add column sort_order integer not null default 0;

-- Keep the current newest-first order, spaced by 10 so posts can be slotted
-- in between without renumbering.
update public.posts p
set sort_order = ordered.position * 10
from (
  select id, row_number() over (order by published_at desc nulls last, slug) as position
  from public.posts
) ordered
where ordered.id = p.id;

-- New columns may only be appended to a view with CREATE OR REPLACE;
-- existing grants and security_invoker are kept.
create or replace view public.published_post_cards
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.published_at,
  p.cover_image_url,
  t.locale,
  t.title,
  t.description,
  ct.name as category_name,
  p.sort_order
from public.posts p
join public.post_translations t on t.post_id = p.id
left join public.category_translations ct
  on ct.category_id = p.category_id
  and ct.locale = t.locale
where p.status = 'published';
