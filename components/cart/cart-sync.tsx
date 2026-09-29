"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { fetchQuote, quoteProducts } from "@/lib/cart/fetch-quote";
import { CART_STORAGE_KEY, useCartStore } from "@/lib/cart/store";
import { usePostsRealtime } from "@/lib/cart/use-posts-realtime";

const QUOTE_DEBOUNCE_MS = 250;

/**
 * Loads the persisted cart, fetches current post data for it, and keeps it
 * live through Realtime. Renders nothing; mount once in the layout.
 */
function CartSync() {
  const locale = useLocale();
  const hydrated = useCartStore((state) => state.hydrated);
  const quoteNonce = useCartStore((state) => state.quoteNonce);
  const idsKey = useCartStore((state) =>
    state.items
      .map((item) => item.postId)
      .sort()
      .join(","),
  );

  useEffect(() => {
    void useCartStore.persist.rehydrate();

    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) void useCartStore.persist.rehydrate();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") useCartStore.getState().requestQuote();
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !idsKey) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const items = useCartStore
        .getState()
        .items.map(({ postId, quantity }) => ({ postId, quantity }));

      const quote = await fetchQuote(items, locale, controller.signal);
      if (quote) useCartStore.getState().upsertProducts(quoteProducts(quote));
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [hydrated, idsKey, locale, quoteNonce]);

  usePostsRealtime(idsKey ? idsKey.split(",") : []);

  return null;
}

export { CartSync };
