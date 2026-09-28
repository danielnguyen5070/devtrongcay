-- Blog content schema. Content is managed through the Supabase Dashboard;
-- the public site reads it with the publishable (anon) key under RLS.

create type public.app_locale as enum ('vi', 'en');
create type public.post_status as enum ('draft', 'published');

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Publishing from the Table Editor should not require typing a timestamp.
create function public.set_post_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.set_post_published_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.category_translations (
  category_id uuid not null references public.categories (id) on delete cascade,
  locale public.app_locale not null,
  name text not null
    constraint category_translations_name_not_blank check (btrim(name) <> ''),
  primary key (category_id, locale)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    constraint posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.post_status not null default 'draft',
  published_at timestamptz,
  category_id uuid references public.categories (id) on delete set null,
  -- Object path inside the `blog-media` bucket, never a full URL.
  cover_image_path text
    constraint posts_cover_image_path_format check (
      cover_image_path is null
      or (
        btrim(cover_image_path) <> ''
        and cover_image_path !~ '^/'
        and position('://' in cover_image_path) = 0
        and position('..' in cover_image_path) = 0
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_published_has_date check (
    status <> 'published' or published_at is not null
  )
);

create index posts_published_at_idx
  on public.posts (published_at desc)
  where status = 'published';

create index posts_category_id_idx on public.posts (category_id);

create table public.post_translations (
  post_id uuid not null references public.posts (id) on delete cascade,
  locale public.app_locale not null,
  title text not null
    constraint post_translations_title_not_blank check (btrim(title) <> ''),
  description text not null default '',
  -- Plain Markdown (GFM). Rendered with MDX in `md` mode: no JSX, no raw HTML.
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, locale)
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  position smallint not null
    constraint post_media_position_non_negative check (position >= 0),
  -- Object path inside the `blog-media` bucket, never a full URL.
  storage_path text not null
    constraint post_media_storage_path_format check (
      btrim(storage_path) <> ''
      and storage_path !~ '^/'
      and position('://' in storage_path) = 0
      and position('..' in storage_path) = 0
    ),
  alt text not null default '',
  created_at timestamptz not null default now(),
  unique (post_id, position)
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create trigger posts_set_published_at
  before insert or update of status, published_at on public.posts
  for each row execute function public.set_post_published_at();

create trigger post_translations_set_updated_at
  before update on public.post_translations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Home page / sitemap view (no Markdown body)
-- ---------------------------------------------------------------------------

create view public.published_post_cards
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.published_at,
  p.cover_image_path,
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

-- ---------------------------------------------------------------------------
-- Privileges: public roles are read-only. Writes happen through the
-- Dashboard / service role, which bypasses RLS.
-- ---------------------------------------------------------------------------

revoke all on table
  public.categories,
  public.category_translations,
  public.posts,
  public.post_translations,
  public.post_media,
  public.published_post_cards
from anon, authenticated;

grant select on table
  public.categories,
  public.category_translations,
  public.posts,
  public.post_translations,
  public.post_media,
  public.published_post_cards
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: read published content only, no write policies.
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.category_translations enable row level security;
alter table public.posts enable row level security;
alter table public.post_translations enable row level security;
alter table public.post_media enable row level security;

create policy "Public can read categories"
  on public.categories
  for select
  to anon, authenticated
  using (true);

create policy "Public can read category translations"
  on public.category_translations
  for select
  to anon, authenticated
  using (true);

create policy "Public can read published posts"
  on public.posts
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Public can read translations of published posts"
  on public.post_translations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_translations.post_id
        and p.status = 'published'
    )
  );

create policy "Public can read media of published posts"
  on public.post_media
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_media.post_id
        and p.status = 'published'
    )
  );
