-- Show the abbreviated scientific name on home page tiles.

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
  p.sort_order,
  p.scientific_name_short
from public.posts p
join public.post_translations t on t.post_id = p.id
left join public.category_translations ct
  on ct.category_id = p.category_id
  and ct.locale = t.locale
where p.status = 'published';
