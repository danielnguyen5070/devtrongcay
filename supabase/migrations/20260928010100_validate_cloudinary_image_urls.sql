-- Push only after `npm run content:import` has rewritten every image field
-- to a Cloudinary URL; fails if any Storage path is left.

alter table public.posts validate constraint posts_cover_image_url_format;
alter table public.post_media validate constraint post_media_image_url_format;
