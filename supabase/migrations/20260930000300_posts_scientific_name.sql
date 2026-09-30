-- Botanical name of the plant a post sells, edited in the Supabase Dashboard.
-- The abbreviated form (Monstera deliciosa -> M. deliciosa) is derived so the
-- two can never disagree. Care articles keep NULL.

alter table public.posts
  add column scientific_name text
    constraint posts_scientific_name_format check (
      scientific_name is null
      or scientific_name ~ '^[A-Z][a-z]+ \S+( \S+)*$'
    ),
  add column scientific_name_short text
    generated always as (
      regexp_replace(scientific_name, '^([A-Z])[a-z]+ ', '\1. ')
    ) stored;

comment on column public.posts.scientific_name is
  'Full botanical name, genus first, e.g. ''Platycerium ridleyi''. NULL for care articles.';
comment on column public.posts.scientific_name_short is
  'Genus abbreviated to its initial, e.g. ''P. ridleyi''. Generated from scientific_name.';

update public.posts p
set scientific_name = v.scientific_name
from (
  values
    ('albo-borsigiana', 'Monstera deliciosa'),
    ('alocasia-bambino-pink-var', 'Alocasia × amazonica'),
    ('alocasia-nobilis', 'Alocasia nobilis'),
    ('alocasia-polly-pink-var', 'Alocasia × amazonica'),
    ('alocasia-scalprum', 'Alocasia scalprum'),
    ('alocasia-silver-dragon', 'Alocasia baginda'),
    ('anthurium-warocqueanum', 'Anthurium warocqueanum'),
    ('green-on-green', 'Monstera deliciosa'),
    ('monstera-adansonii', 'Monstera adansonii'),
    ('monstera-aurea', 'Monstera deliciosa'),
    ('monstera-dubia', 'Monstera dubia'),
    ('monstera-esqueleto', 'Monstera sp. ''Esqueleto'''),
    ('monstera-lechleriana', 'Monstera lechleriana'),
    ('monstera-mint', 'Monstera deliciosa'),
    ('monstera-obliqua', 'Monstera obliqua'),
    ('monstera-peru', 'Monstera sp. ''Peru'''),
    ('monstera-pinnatipartita', 'Monstera pinnatipartita'),
    ('monstera-siltepecana', 'Monstera siltepecana'),
    ('monstera-standleyana', 'Monstera standleyana'),
    ('philo-billietiae', 'Philodendron billietiae'),
    ('philo-florida-beauty', 'Philodendron ''Florida Beauty'''),
    ('philo-giganteum-var', 'Philodendron giganteum'),
    ('philo-pink-princess', 'Philodendron erubescens'),
    ('platycerium-ridleyi', 'Platycerium ridleyi'),
    ('thai-constellation', 'Monstera deliciosa')
) as v (slug, scientific_name)
where p.slug = v.slug;
