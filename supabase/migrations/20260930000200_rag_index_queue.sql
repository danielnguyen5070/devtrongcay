-- Keeps document_chunks in sync with content edited in the Dashboard.
--
-- Triggers queue (post_id, locale) pairs whose indexed text may have changed.
-- A Database Webhook calls the site to embed them:
--
--   Dashboard > Database > Webhooks > Create
--     Table:   public.rag_index_queue
--     Events:  Insert, Update
--     Type:    HTTP Request, POST https://<site>/api/rag/sync
--     Headers: Authorization: Bearer <RAG_SYNC_SECRET>
--
-- Optional safety net for failed or missed jobs (pg_cron + pg_net enabled,
-- secret stored in Vault as 'rag_sync_secret'):
--
--   select cron.schedule('rag-sync', '*/10 * * * *', $cron$
--     select net.http_post(
--       url := 'https://<site>/api/rag/sync',
--       headers := jsonb_build_object('Authorization', 'Bearer ' || (
--         select decrypted_secret from vault.decrypted_secrets where name = 'rag_sync_secret'))
--     )
--     where exists (select 1 from public.rag_index_queue);
--   $cron$);
--
-- The queue is only about freshness. Correctness does not depend on it:
-- match_document_chunks ignores unpublished posts and chunks older than
-- their translation, and deletes cascade.

create table public.rag_index_queue (
  post_id uuid not null,
  locale public.app_locale not null,
  requested_at timestamptz not null default clock_timestamp(),
  -- Lease while a worker processes the job; also delays retries after errors.
  locked_until timestamptz,
  attempts smallint not null default 0,
  last_error text,
  primary key (post_id, locale),
  foreign key (post_id, locale)
    references public.post_translations (post_id, locale)
    on update cascade
    on delete cascade
);

create index rag_index_queue_requested_at_idx on public.rag_index_queue (requested_at);

revoke all on table public.rag_index_queue from anon, authenticated;
alter table public.rag_index_queue enable row level security;

-- ---------------------------------------------------------------------------
-- Enqueue helpers
-- ---------------------------------------------------------------------------

-- A new edit restarts the job. A job already leased by a worker keeps its
-- lease; finish_rag_index_job releases it when a newer request arrived.
-- Failed jobs waiting for a retry are released immediately.
create function public.rag_enqueue_translation(p_post_id uuid, p_locale public.app_locale)
returns void
language sql
set search_path = ''
as $$
  insert into public.rag_index_queue (post_id, locale)
  values (p_post_id, p_locale)
  on conflict (post_id, locale) do update
  set requested_at = clock_timestamp(),
      attempts = 0,
      last_error = null,
      locked_until = case
        when public.rag_index_queue.last_error is null then public.rag_index_queue.locked_until
      end;
$$;

create function public.rag_enqueue_category(p_category_id uuid, p_locale public.app_locale)
returns void
language sql
set search_path = ''
as $$
  select public.rag_enqueue_translation(t.post_id, t.locale)
  from public.posts p
  join public.post_translations t on t.post_id = p.id
  where p.category_id = p_category_id
    and t.locale = p_locale
    and p.status = 'published';
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Any update bumps updated_at, which makes existing chunks stale, so every
-- update is queued; the indexer skips embedding when the text is unchanged.
create function public.rag_post_translations_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.posts p
    where p.id = new.post_id and p.status = 'published'
  ) then
    perform public.rag_enqueue_translation(new.post_id, new.locale);
  end if;
  return null;
end;
$$;

create trigger post_translations_rag_enqueue
  after insert or update on public.post_translations
  for each row execute function public.rag_post_translations_changed();

-- Price and stock changes (place_order) do not affect the index, so only
-- status, category and slug are watched.
create function public.rag_posts_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published' then
    if tg_op = 'INSERT'
      or old.status is distinct from new.status
      or old.category_id is distinct from new.category_id
      or old.slug is distinct from new.slug then
      perform public.rag_enqueue_translation(t.post_id, t.locale)
      from public.post_translations t
      where t.post_id = new.id;
    end if;
  elsif tg_op = 'UPDATE' and old.status = 'published' then
    delete from public.document_chunks where post_id = new.id;
    delete from public.rag_index_queue where post_id = new.id;
  end if;
  return null;
end;
$$;

create trigger posts_rag_sync
  after insert or update of status, category_id, slug on public.posts
  for each row execute function public.rag_posts_changed();

-- Category names are part of every chunk header.
create function public.rag_category_translations_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.rag_enqueue_category(old.category_id, old.locale);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.rag_enqueue_category(new.category_id, new.locale);
  end if;
  return null;
end;
$$;

create trigger category_translations_rag_enqueue
  after insert or update or delete on public.category_translations
  for each row execute function public.rag_category_translations_changed();

-- ---------------------------------------------------------------------------
-- Worker API (service role only)
-- ---------------------------------------------------------------------------

-- Leases up to p_limit jobs for 5 minutes. Jobs that failed 5 times stay in
-- the table with last_error until re-queued (a new edit or `rag:index --all`).
create function public.claim_rag_index_jobs(p_limit integer default 5)
returns table (post_id uuid, locale public.app_locale, requested_at timestamptz)
language sql
set search_path = ''
as $$
  with picked as (
    select q.post_id, q.locale
    from public.rag_index_queue q
    where (q.locked_until is null or q.locked_until < now())
      and q.attempts < 5
    order by q.requested_at
    limit least(greatest(p_limit, 1), 50)
    for update skip locked
  )
  update public.rag_index_queue q
  set locked_until = now() + interval '5 minutes',
      attempts = q.attempts + 1
  from picked
  where q.post_id = picked.post_id
    and q.locale = picked.locale
  returning q.post_id, q.locale, q.requested_at;
$$;

-- Completes a claimed job. If the content changed while it ran (newer
-- requested_at), the job is released for immediate reprocessing and true is
-- returned. On error the lease is kept as a retry delay.
create function public.finish_rag_index_job(
  p_post_id uuid,
  p_locale public.app_locale,
  p_requested_at timestamptz,
  p_error text default null
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if p_error is null then
    delete from public.rag_index_queue
    where post_id = p_post_id and locale = p_locale and requested_at = p_requested_at;
  else
    update public.rag_index_queue
    set last_error = left(p_error, 1000)
    where post_id = p_post_id and locale = p_locale and requested_at = p_requested_at;
  end if;

  if found then
    return false;
  end if;

  update public.rag_index_queue
  set locked_until = null
  where post_id = p_post_id and locale = p_locale;
  return found;
end;
$$;

-- Queues every published translation, or only those of p_post_ids.
create function public.enqueue_rag_index_jobs(p_post_ids uuid[] default null)
returns integer
language sql
set search_path = ''
as $$
  with queued as (
    insert into public.rag_index_queue (post_id, locale)
    select t.post_id, t.locale
    from public.post_translations t
    join public.posts p on p.id = t.post_id
    where p.status = 'published'
      and (p_post_ids is null or t.post_id = any (p_post_ids))
    on conflict (post_id, locale) do update
    set requested_at = clock_timestamp(),
        attempts = 0,
        last_error = null,
        locked_until = null
    returning 1
  )
  select count(*)::integer from queued;
$$;

revoke execute on function public.rag_enqueue_translation(uuid, public.app_locale)
  from public, anon, authenticated;
revoke execute on function public.rag_enqueue_category(uuid, public.app_locale)
  from public, anon, authenticated;
revoke execute on function public.rag_post_translations_changed()
  from public, anon, authenticated;
revoke execute on function public.rag_posts_changed()
  from public, anon, authenticated;
revoke execute on function public.rag_category_translations_changed()
  from public, anon, authenticated;

revoke execute on function public.claim_rag_index_jobs(integer)
  from public, anon, authenticated;
revoke execute on function public.finish_rag_index_job(uuid, public.app_locale, timestamptz, text)
  from public, anon, authenticated;
revoke execute on function public.enqueue_rag_index_jobs(uuid[])
  from public, anon, authenticated;

grant execute on function public.claim_rag_index_jobs(integer) to service_role;
grant execute on function public.finish_rag_index_job(uuid, public.app_locale, timestamptz, text)
  to service_role;
grant execute on function public.enqueue_rag_index_jobs(uuid[]) to service_role;
