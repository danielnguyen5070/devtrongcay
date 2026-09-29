import "server-only";
import { routing, type AppLocale } from "@/i18n/routing";
import { summarizeCart, type CartSummaryResult } from "@/lib/cart/summary";
import type { CartItemInput, LiveProduct } from "@/lib/cart/types";
import { getCoverUrl } from "@/lib/media";
import { getPublicSupabase } from "@/lib/supabase/public";

export type CartQuoteLine = CartSummaryResult["lines"][number] & {
  product: LiveProduct | null;
  availability: Exclude<CartSummaryResult["lines"][number]["availability"], "loading">;
};

export type CartQuote = Omit<CartSummaryResult, "lines"> & {
  lines: CartQuoteLine[];
};

/**
 * Prices a cart from the current `posts` rows. Client prices, stock and
 * totals are never read. Unpublished or missing posts come back as
 * `product: null` (RLS hides them from the anon client).
 */
export async function quoteCart(
  items: CartItemInput[],
  locale: AppLocale,
): Promise<CartQuote> {
  const products: Record<string, LiveProduct | null> = {};
  for (const item of items) products[item.postId] = null;

  if (items.length > 0) {
    const { data, error } = await getPublicSupabase()
      .from("posts")
      .select(
        `id, slug, status, price_vnd, stock, product_status, cover_image_url,
         translations:post_translations(locale, title)`,
      )
      .in(
        "id",
        items.map((item) => item.postId),
      );

    if (error) {
      console.error(`[cart] Failed to load posts: ${error.message}`, error.code ?? "");
      throw new Error("Failed to load cart products.");
    }

    for (const row of data) {
      const title =
        row.translations.find((item) => item.locale === locale)?.title ??
        row.translations.find((item) => item.locale === routing.defaultLocale)?.title ??
        row.translations[0]?.title ??
        row.slug;

      products[row.id] = {
        postId: row.id,
        slug: row.slug,
        title,
        coverImage: getCoverUrl(row.cover_image_url),
        priceVnd: row.price_vnd,
        stock: row.stock,
        productStatus: row.product_status,
        published: row.status === "published",
      };
    }
  }

  return summarizeCart(items, products) as CartQuote;
}
