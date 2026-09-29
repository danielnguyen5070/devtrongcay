-- Cosine similarity search over document_chunks for the chatbot.
--
-- Only chunks of published posts whose translation has not changed since
-- indexing are returned, so unpublished, deleted or edited content is never
-- served even before the re-index job runs.
--
-- No ANN index yet: at a few thousand chunks an exact scan takes a few
-- milliseconds with perfect recall and exact filtering. Past ~20k chunks add
--   create index document_chunks_embedding_hnsw_idx on public.document_chunks
--     using hnsw (embedding extensions.vector_cosine_ops);
-- and `set hnsw.iterative_scan = relaxed_order` on this function so filtered
-- queries still return match_count rows.

create function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_count integer default 6,
  match_threshold double precision default 0.3,
  filter_locale public.app_locale default null,
  filter_post_ids uuid[] default null,
  filter_category_ids uuid[] default null
)
returns table (
  id uuid,
  post_id uuid,
  locale public.app_locale,
  slug text,
  title text,
  heading text,
  content text,
  similarity double precision
)
language sql
stable
set search_path = ''
as $$
  select
    c.id,
    c.post_id,
    c.locale,
    p.slug,
    t.title,
    c.heading,
    c.content,
    1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.document_chunks c
  join public.post_translations t
    on t.post_id = c.post_id
    and t.locale = c.locale
  join public.posts p on p.id = c.post_id
  where p.status = 'published'
    and t.updated_at = c.source_updated_at
    and (filter_locale is null or c.locale = filter_locale)
    and (filter_post_ids is null or c.post_id = any (filter_post_ids))
    and (filter_category_ids is null or p.category_id = any (filter_category_ids))
    and 1 - (c.embedding operator(extensions.<=>) query_embedding) >= match_threshold
  order by c.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

revoke execute on function public.match_document_chunks(
  extensions.vector, integer, double precision, public.app_locale, uuid[], uuid[]
) from public, anon, authenticated;
grant execute on function public.match_document_chunks(
  extensions.vector, integer, double precision, public.app_locale, uuid[], uuid[]
) to service_role;
