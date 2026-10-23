-- Guest review submission via SECURITY DEFINER RPC. Direct INSERT on
-- post_reviews stays closed to anon/authenticated; only this function may
-- create pending rows for published posts.

create or replace function public.submit_review(
  p_slug text,
  p_locale public.app_locale,
  p_author_name text,
  p_rating smallint,
  p_comment text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_post_id uuid;
  v_review_id uuid;
  v_name text := btrim(coalesce(p_author_name, ''));
  v_comment text := btrim(coalesce(p_comment, ''));
begin
  if p_slug is null
    or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'not_found';
  end if;

  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'invalid_name';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'invalid_rating';
  end if;

  if char_length(v_comment) < 1 or char_length(v_comment) > 2000 then
    raise exception 'invalid_comment';
  end if;

  select p.id
  into v_post_id
  from public.posts p
  where p.slug = p_slug
    and p.status = 'published';

  if not found then
    raise exception 'not_found';
  end if;

  insert into public.post_reviews (
    post_id, locale, author_name, rating, comment
  )
  values (
    v_post_id, p_locale, v_name, p_rating, v_comment
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function public.submit_review(text, public.app_locale, text, smallint, text)
  from public;
grant execute on function public.submit_review(text, public.app_locale, text, smallint, text)
  to anon, authenticated;
