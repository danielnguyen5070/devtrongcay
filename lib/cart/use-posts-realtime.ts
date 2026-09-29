"use client";

import { useEffect, useId } from "react";
import { useCartStore } from "@/lib/cart/store";
import { getCoverUrl } from "@/lib/media";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Tables } from "@/types/database";

/**
 * Keeps price, stock, status and cover image of the given posts live in the
 * cart store. UI sync only: checkout always re-validates on the server.
 */
export function usePostsRealtime(postIds: string[]) {
  const channelId = useId();
  const key = [...new Set(postIds)].sort().join(",");

  useEffect(() => {
    if (!key) return;

    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`posts-live${channelId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts", filter: `id=in.(${key})` },
        (payload) => {
          const row = payload.new as Partial<Tables<"posts">>;
          if (!row.id) return;

          const { patchProduct, requestQuote } = useCartStore.getState();
          const patched = patchProduct(row.id, {
            ...(row.price_vnd !== undefined && { priceVnd: row.price_vnd }),
            ...(row.stock !== undefined && { stock: row.stock }),
            ...(row.product_status !== undefined && { productStatus: row.product_status }),
            ...(row.status !== undefined && { published: row.status === "published" }),
            ...(row.cover_image_url !== undefined && {
              coverImage: getCoverUrl(row.cover_image_url),
            }),
          });
          if (!patched) requestQuote();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [key, channelId]);
}
