-- Knowledge base for the plant chatbot. Each published post translation is
-- split into chunks and embedded with OpenAI text-embedding-3-small (1536
-- dimensions). Only the server (service role) reads or writes these rows;
-- public roles have no access.
--
-- Prices and stock are never stored here: the chatbot reads them live from
-- public.posts.

create extension if not exists vector with schema extensions;

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  locale public.app_locale not null,
  chunk_index smallint not null
    constraint document_chunks_chunk_index_non_negative check (chunk_index >= 0),
  -- Heading path inside the post body, e.g. 'Care > Watering'.
  heading text not null default '',
  -- Contextual header (plant, category, section) + section text. This exact
  -- text is embedded and sent to the LLM.
  content text not null
    constraint document_chunks_content_not_blank check (btrim(content) <> ''),
  content_hash text not null,
  token_count integer not null
    constraint document_chunks_token_count_positive check (token_count > 0),
  embedding extensions.vector(1536) not null,
  embedding_model text not null,
  -- Hash of the indexed source fields; equal hashes skip re-embedding.
  source_hash text not null,
  -- post_translations.updated_at at index time. Chunks whose value no longer
  -- matches the translation are stale and never returned by search.
  source_updated_at timestamptz not null,
  -- { slug, title, category_id, category_name, heading_path }
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, locale, chunk_index),
  foreign key (post_id, locale)
    references public.post_translations (post_id, locale)
    on update cascade
    on delete cascade
);

create index document_chunks_post_locale_idx
  on public.document_chunks (post_id, locale);

create trigger document_chunks_set_updated_at
  before update on public.document_chunks
  for each row execute function public.set_updated_at();

revoke all on table public.document_chunks from anon, authenticated;
alter table public.document_chunks enable row level security;

-- ---------------------------------------------------------------------------
-- replace_document_chunks: swap all chunks of one (post, locale) in a single
-- transaction so search never sees a half-written or duplicated set.
--
-- p_chunks: [{ chunk_index, heading, content, content_hash, token_count,
--              embedding ('[0.1,...]' text), metadata }]
--           NULL keeps the existing chunks and only marks them fresh (used
--           when the source hash did not change).
--
-- Returns false without writing when the translation changed after it was
-- read, or the post is no longer published; the newer edit is re-queued.
-- ---------------------------------------------------------------------------

create function public.replace_document_chunks(
  p_post_id uuid,
  p_locale public.app_locale,
  p_source_updated_at timestamptz,
  p_source_hash text,
  p_embedding_model text,
  p_chunks jsonb
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform 1
  from public.post_translations t
  join public.posts p on p.id = t.post_id
  where t.post_id = p_post_id
    and t.locale = p_locale
    and t.updated_at = p_source_updated_at
    and p.status = 'published'
  for update of t;

  if not found then
    return false;
  end if;

  if p_chunks is null then
    update public.document_chunks
    set source_updated_at = p_source_updated_at
    where post_id = p_post_id
      and locale = p_locale
      and source_hash = p_source_hash
      and embedding_model = p_embedding_model;
    return found;
  end if;

  if jsonb_typeof(p_chunks) is distinct from 'array' or jsonb_array_length(p_chunks) = 0 then
    raise exception 'invalid_chunks';
  end if;

  delete from public.document_chunks
  where post_id = p_post_id and locale = p_locale;

  insert into public.document_chunks (
    post_id, locale, chunk_index, heading, content, content_hash, token_count,
    embedding, embedding_model, source_hash, source_updated_at, metadata
  )
  select
    p_post_id,
    p_locale,
    c.chunk_index,
    coalesce(c.heading, ''),
    c.content,
    c.content_hash,
    c.token_count,
    c.embedding::extensions.vector(1536),
    p_embedding_model,
    p_source_hash,
    p_source_updated_at,
    coalesce(c.metadata, '{}')
  from jsonb_to_recordset(p_chunks) as c (
    chunk_index smallint,
    heading text,
    content text,
    content_hash text,
    token_count integer,
    embedding text,
    metadata jsonb
  );

  return true;
end;
$$;

revoke execute on function public.replace_document_chunks(
  uuid, public.app_locale, timestamptz, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.replace_document_chunks(
  uuid, public.app_locale, timestamptz, text, text, jsonb
) to service_role;
