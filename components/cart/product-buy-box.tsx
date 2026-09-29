"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchQuote, quoteProducts } from "@/lib/cart/fetch-quote";
import { useCartStore } from "@/lib/cart/store";
import { MAX_ITEM_QUANTITY, getAvailability, type LiveProduct } from "@/lib/cart/types";
import { usePostsRealtime } from "@/lib/cart/use-posts-realtime";
import { formatVnd } from "@/lib/pricing";
import { QuantityStepper } from "./quantity-stepper";

type ProductBuyBoxProps = {
  /** Rendered with the (ISR-cached) page; refreshed on mount and by Realtime. */
  initialProduct: LiveProduct;
};

function ProductBuyBox({ initialProduct }: ProductBuyBoxProps) {
  const t = useTranslations("product");
  const locale = useLocale();
  const postId = initialProduct.postId;
  const live = useCartStore((state) => state.products[postId]);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const { products, upsertProducts } = useCartStore.getState();
    if (products[postId] === undefined) upsertProducts({ [postId]: initialProduct });

    const controller = new AbortController();
    void fetchQuote([{ postId, quantity: 1 }], locale, controller.signal).then((quote) => {
      if (quote) useCartStore.getState().upsertProducts(quoteProducts(quote));
    });
    return () => controller.abort();
  }, [postId, locale, initialProduct]);

  usePostsRealtime([postId]);

  const product = live === undefined ? initialProduct : live;
  const availability = getAvailability(product, 1);
  const maxQuantity = Math.max(1, Math.min(product?.stock ?? 0, MAX_ITEM_QUANTITY));
  const selected = Math.min(quantity, maxQuantity);
  const canBuy = availability === "ok";

  let status: string;
  if (availability === "unavailable") status = t("noLongerAvailable");
  else if (availability === "out_of_stock") status = t("outOfStock");
  else status = t("inStock", { count: product?.stock ?? 0 });

  return (
    <section
      aria-label={t("price")}
      className="mt-8 border-b border-white/14 pb-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-heading text-2xl tabular-nums text-[#e7e9e3]">
          {product?.priceVnd != null ? formatVnd(product.priceVnd, locale) : null}
        </p>
        <p
          aria-live="polite"
          className={
            canBuy
              ? "text-[11px] tracking-[0.24em] text-[#9da39a] uppercase"
              : "text-[11px] tracking-[0.24em] text-[#e0867f] uppercase"
          }
        >
          {status}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <QuantityStepper
          value={selected}
          max={maxQuantity}
          disabled={!canBuy}
          onDecrement={() => setQuantity(Math.max(1, selected - 1))}
          onIncrement={() => setQuantity(Math.min(maxQuantity, selected + 1))}
        />
        <button
          type="button"
          disabled={!canBuy}
          onClick={() => {
            addItem(postId, selected);
            setQuantity(1);
            openCart();
          }}
          className="flex-1 bg-[#c8d4c0] px-6 py-3 text-[11px] tracking-[0.3em] text-[#080908] uppercase transition-colors hover:bg-[#e7e9e3] disabled:cursor-not-allowed disabled:bg-[#c8d4c0]/30"
        >
          {t("addToCart")}
        </button>
      </div>
      <p className="mt-3 text-xs text-[#9da39a]">
        {t("maxPerOrder", { count: MAX_ITEM_QUANTITY })}
      </p>
    </section>
  );
}

export { ProductBuyBox };
