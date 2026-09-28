-- Images move from Supabase Storage to Cloudinary. The database stores full
-- Cloudinary delivery URLs. Constraints are NOT VALID so existing Storage
-- paths survive until the import rewrites them; a follow-up migration
-- validates them.

alter table public.posts
  rename column cover_image_path to cover_image_url;

alter table public.posts
  drop constraint posts_cover_image_path_format;

alter table public.posts
  add constraint posts_cover_image_url_format check (
    cover_image_url is null
    or cover_image_url ~ '^https://res\.cloudinary\.com/[A-Za-z0-9_-]+/image/upload/'
  ) not valid;

alter table public.post_media
  rename column storage_path to image_url;

alter table public.post_media
  drop constraint post_media_storage_path_format;

alter table public.post_media
  add constraint post_media_image_url_format check (
    image_url ~ '^https://res\.cloudinary\.com/[A-Za-z0-9_-]+/image/upload/'
  ) not valid;

comment on column public.posts.cover_image_url is
  'Cloudinary delivery URL (https://res.cloudinary.com/<cloud>/image/upload/...).';
comment on column public.post_media.image_url is
  'Cloudinary delivery URL (https://res.cloudinary.com/<cloud>/image/upload/...).';

-- A renamed column keeps its old name in the view output, so recreate it.
drop view public.published_post_cards;

create view public.published_post_cards
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
  ct.name as category_name
from public.posts p
join public.post_translations t on t.post_id = p.id
left join public.category_translations ct
  on ct.category_id = p.category_id
  and ct.locale = t.locale
where p.status = 'published';

revoke all on table public.published_post_cards from anon, authenticated;
grant select on table public.published_post_cards to anon, authenticated;
