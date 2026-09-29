"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cart/store";
import type { CartSummaryLine } from "@/lib/cart/summary";
import { MAX_ITEM_QUANTITY } from "@/lib/cart/types";
import { formatVnd } from "@/lib/pricing";
import { QuantityStepper } from "./quantity-stepper";

type CartLineProps = {
  line: CartSummaryLine;
  onNavigate?: () => void;
};

function CartLine({ line, onNavigate }: CartLineProps) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);

  const { product, quantity, availability } = line;
  const title = product?.title ?? (product === null ? t("unknownItem") : "…");

  let message: string | null = null;
  if (availability === "loading") message = t("loading");
  else if (availability === "insufficient_stock" && product)
    message = t("onlyAvailable", { count: product.stock });
  else if (availability === "out_of_stock") message = t("outOfStock");
  else if (availability === "unavailable") message = t("noLongerAvailable");

  const flagged =
    availability === "insufficient_stock" ||
    availability === "out_of_stock" ||
    availability === "unavailable";

  // Never above the current quantity's stock, but never forces it down.
  const max =
    product && availability !== "unavailable"
      ? Math.max(quantity, Math.min(product.stock, MAX_ITEM_QUANTITY))
      : quantity;

  return (
    <li
      className="flex gap-4 border-b border-white/14 py-4"
      data-invalid={flagged || undefined}
    >
      <div className="relative size-16 shrink-0 bg-[#090b09]">
        {product ? (
          <Image
            src={product.coverImage}
            alt={product.title}
            fill
            sizes="64px"
            className="object-contain"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          {product ? (
            <Link
              href={`/blog/${product.slug}`}
              onClick={onNavigate}
              className="truncate text-sm text-[#e7e9e3] hover:underline"
            >
              {title}
            </Link>
          ) : (
            <span className="truncate text-sm text-[#9da39a]">{title}</span>
          )}
          <span className="shrink-0 text-sm tabular-nums text-[#e7e9e3]">
            {product?.priceVnd != null ? formatVnd(product.priceVnd, locale) : null}
          </span>
        </div>

        {message ? (
          <p
            role={flagged ? "alert" : undefined}
            className={
              flagged
                ? "mt-1 text-xs text-[#e0867f]"
                : "mt-1 text-xs text-[#9da39a]"
            }
          >
            {message}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <QuantityStepper
            value={quantity}
            max={max}
            onDecrement={() => decrement(line.postId)}
            onIncrement={() => increment(line.postId)}
          />
          <button
            type="button"
            onClick={() => removeItem(line.postId)}
            className="text-[11px] tracking-[0.24em] text-[#9da39a] uppercase transition-colors hover:text-[#e7e9e3]"
          >
            {t("remove")}
          </button>
        </div>
      </div>
    </li>
  );
}

export { CartLine };
