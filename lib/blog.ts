import "server-only";
import { cache } from "react";
import { hasLocale } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";
import { getCoverUrl } from "@/lib/media";
import { getPublicSupabase } from "@/lib/supabase/public";
import type { BlogPost, BlogPostMeta } from "@/types/blog";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug);
}

/** Logs the database error server-side and throws a generic one. */
function queryFailed(what: string, error: { message: string; code?: string }): never {
  console.error(`[blog] Failed to load ${what}: ${error.message}`, error.code ?? "");
  throw new Error(`Failed to load ${what}.`);
}

function sortLocales(locales: Iterable<AppLocale>) {
  const set = new Set(locales);
  return routing.locales.filter((locale) => set.has(locale));
}

function latestDate(...values: string[]) {
  return values.reduce((latest, value) =>
    new Date(value).getTime() > new Date(latest).getTime() ? value : latest,
  );
}

export const getPublishedPosts = cache(
  async (locale: string): Promise<BlogPostMeta[]> => {
    if (!hasLocale(routing.locales, locale)) return [];

    const { data, error } = await getPublicSupabase()
      .from("published_post_cards")
      .select("slug, published_at, cover_image_url, title, description, category_name")
      .eq("locale", locale)
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false })
      .order("slug");

    if (error) queryFailed("posts", error);

    return data.flatMap((row) =>
      row.slug && row.title
        ? [
            {
              slug: row.slug,
              title: row.title,
              description: row.description ?? "",
              date: row.published_at ?? "",
              coverImage: getCoverUrl(row.cover_image_url),
              category: row.category_name ?? "",
            },
          ]
        : [],
    );
  },
);

/** Every published (locale, slug) pair, in display order. */
export const getPublishedSlugs = cache(
  async (): Promise<{ locale: AppLocale; slug: string }[]> => {
    const { data, error } = await getPublicSupabase()
      .from("published_post_cards")
      .select("slug, locale")
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false })
      .order("slug");

    if (error) queryFailed("slugs", error);

    return data.flatMap((row) =>
      row.slug && row.locale ? [{ locale: row.locale, slug: row.slug }] : [],
    );
  },
);

/** Published posts with the last-modified time of each translation. */
export const getSitemapPosts = cache(
  async (): Promise<{ slug: string; updatedAt: Partial<Record<AppLocale, string>> }[]> => {
    const { data, error } = await getPublicSupabase()
      .from("posts")
      .select("slug, updated_at, translations:post_translations(locale, updated_at)")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false })
      .order("slug");

    if (error) queryFailed("sitemap posts", error);

    return data.map((row) => {
      const updatedAt: Partial<Record<AppLocale, string>> = {};
      for (const translation of row.translations) {
        updatedAt[translation.locale] = latestDate(row.updated_at, translation.updated_at);
      }
      return { slug: row.slug, updatedAt };
    });
  },
);

/** Locales in which a published post has a translation. */
export const getPostLocales = cache(
  async (slug: string): Promise<AppLocale[]> => {
    if (!isValidSlug(slug)) return [];

    const { data, error } = await getPublicSupabase()
      .from("published_post_cards")
      .select("locale")
      .eq("slug", slug);

    if (error) queryFailed("post locales", error);

    return sortLocales(data.flatMap((row) => (row.locale ? [row.locale] : [])));
  },
);

export const getPublishedPost = cache(
  async (locale: string, slug: string): Promise<BlogPost | null> => {
    if (!hasLocale(routing.locales, locale) || !isValidSlug(slug)) {
      return null;
    }

    const { data, error } = await getPublicSupabase()
      .from("posts")
      .select(
        `id, slug, published_at, updated_at, cover_image_url, price_vnd, stock, product_status,
         translation:post_translations!inner(title, description, body, updated_at),
         category:categories(translations:category_translations(locale, name)),
         media:post_media(position, image_url, alt)`,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .eq("translation.locale", locale)
      .maybeSingle();

    if (error) queryFailed("post", error);

    const translation = data?.translation[0];
    if (!data || !translation) return null;

    const category =
      data.category?.translations.find((item) => item.locale === locale)?.name ?? "";

    return {
      slug: data.slug,
      title: translation.title,
      description: translation.description,
      date: data.published_at ?? "",
      updatedAt: latestDate(data.updated_at, translation.updated_at),
      coverImage: getCoverUrl(data.cover_image_url),
      category,
      content: translation.body,
      gallery: [...data.media]
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          src: item.image_url,
          alt: item.alt || translation.title,
        })),
      product: {
        id: data.id,
        priceVnd: data.price_vnd,
        stock: data.stock,
        productStatus: data.product_status,
      },
    };
  },
);
