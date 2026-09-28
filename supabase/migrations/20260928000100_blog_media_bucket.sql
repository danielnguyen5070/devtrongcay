-- Public bucket for blog images. Objects are readable through the public
-- object URL; there are intentionally no storage.objects policies for anon or
-- authenticated, so the public API cannot list, upload, update or delete.
-- Uploads happen through the Dashboard or the local import script.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-media',
  'blog-media',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
