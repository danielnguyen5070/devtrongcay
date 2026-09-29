import "server-only";
import { routing, type AppLocale } from "@/i18n/routing";
import { isSellable, type LiveProduct } from "@/lib/cart/types";
import { getCoverUrl } from "@/lib/media";
import { formatVnd } from "@/lib/pricing";
import { findPostIdsByName } from "@/lib/rag/search";
import { getPublicSupabase } from "@/lib/supabase/public";

export type ProductInfo = {
  title: string;
  url: string;
  /** Formatted in the user's locale; null when the plant is not sold. */
  price: string | null;
  priceVnd: number | null;
  stock: number;
  forSale: boolean;
  inStock: boolean;
};

const MAX_RESULTS = 3;

function fail(what: string, error: { message: string; code?: string }): never {
  console.error(`[chat] Failed to ${what}: ${error.message}`, error.code ?? "");
  throw new Error(`Failed to ${what}.`);
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

async function findIdsByTitle(name: string): Promise<string[]> {
  const { data, error } = await getPublicSupabase()
    .from("post_translations")
    .select("post_id")
    .ilike("title", `%${escapeLike(name)}%`)
    .limit(MAX_RESULTS * 2);
  if (error) fail("search products by title", error);
  return [...new Set(data.map((row) => row.post_id))].slice(0, MAX_RESULTS);
}

/**
 * Current price and stock for plants matching a name. Always reads live
 * `posts` rows with the anon client, so RLS limits results to published posts.
 * Unaccented or partial names fall back to vector search to find the post.
 */
export async function findProducts(name: string, locale: AppLocale): Promise<ProductInfo[]> {
  const query = name.trim().slice(0, 100);
  if (!query) return [];

  let ids = await findIdsByTitle(query);
  if (ids.length === 0) ids = await findPostIdsByName(query, MAX_RESULTS);
  if (ids.length === 0) return [];

  const { data, error } = await getPublicSupabase()
    .from("posts")
    .select(
      `id, slug, status, price_vnd, stock, product_status, cover_image_url,
       translations:post_translations(locale, title)`,
    )
    .in("id", ids);
  if (error) fail("load products", error);

  const byId = new Map(data.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];

    const translation =
      row.translations.find((item) => item.locale === locale) ??
      row.translations.find((item) => item.locale === routing.defaultLocale) ??
      row.translations[0];
    const title = translation?.title ?? row.slug;
    const pageLocale = translation?.locale ?? locale;

    const product: LiveProduct = {
      postId: row.id,
      slug: row.slug,
      title,
      coverImage: getCoverUrl(row.cover_image_url),
      priceVnd: row.price_vnd,
      stock: row.stock,
      productStatus: row.product_status,
      published: row.status === "published",
    };
    const forSale = isSellable(product);

    return [
      {
        title,
        url: `/${pageLocale}/blog/${row.slug}`,
        price: forSale && row.price_vnd !== null ? formatVnd(row.price_vnd, locale) : null,
        priceVnd: forSale ? row.price_vnd : null,
        stock: forSale ? row.stock : 0,
        forSale,
        inStock: forSale && row.stock > 0,
      },
    ];
  });
}
