-- Guest reviews on posts. Visitors submit through the server (service role),
-- every review starts as 'pending', and only 'approved' reviews of published
-- posts are readable by public roles. Moderate in the Dashboard Table Editor
-- by changing `status`.

create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.post_reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  -- Language the review was written in; reviews are shown on every locale.
  locale public.app_locale not null,
  author_name text not null
    constraint post_reviews_author_name_length check (char_length(btrim(author_name)) between 1 and 80),
  rating smallint not null
    constraint post_reviews_rating_range check (rating between 1 and 5),
  comment text not null
    constraint post_reviews_comment_length check (char_length(btrim(comment)) between 1 and 2000),
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index post_reviews_approved_idx
  on public.post_reviews (post_id, created_at desc)
  where status = 'approved';

create index post_reviews_status_created_at_idx
  on public.post_reviews (status, created_at desc);

create trigger post_reviews_set_updated_at
  before update on public.post_reviews
  for each row execute function public.set_updated_at();

revoke all on table public.post_reviews from anon, authenticated;
grant select on table public.post_reviews to anon, authenticated;

alter table public.post_reviews enable row level security;

create policy "Public can read approved reviews of published posts"
  on public.post_reviews
  for select
  to anon, authenticated
  using (
    status = 'approved'
    and exists (
      select 1
      from public.posts p
      where p.id = post_reviews.post_id
        and p.status = 'published'
    )
  );
