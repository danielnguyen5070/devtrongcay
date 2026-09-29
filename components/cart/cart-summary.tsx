"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CartSummaryResult } from "@/lib/cart/summary";
import { FREE_SHIPPING_THRESHOLD_VND, formatVnd } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type CartSummaryProps = {
  summary: CartSummaryResult;
  showCheckout?: boolean;
  onCheckout?: () => void;
  className?: string;
};

function CartSummary({
  summary,
  showCheckout = true,
  onCheckout,
  className,
}: CartSummaryProps) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { subtotalVnd, shippingFeeVnd, totalVnd, canCheckout, lines } = summary;
  const remaining = FREE_SHIPPING_THRESHOLD_VND - subtotalVnd;
  const hasIssues = lines.some(
    (line) => line.availability !== "ok" && line.availability !== "loading",
  );

  return (
    <div className={cn("space-y-2 text-sm", className)}>
      <div className="flex justify-between text-[#9da39a]">
        <span>{t("subtotal")}</span>
        <span className="tabular-nums text-[#e7e9e3]">{formatVnd(subtotalVnd, locale)}</span>
      </div>
      <div className="flex justify-between text-[#9da39a]">
        <span>{t("shipping")}</span>
        <span className="tabular-nums text-[#e7e9e3]">
          {subtotalVnd > 0 && shippingFeeVnd === 0
            ? t("freeShipping")
            : formatVnd(shippingFeeVnd, locale)}
        </span>
      </div>
      {subtotalVnd > 0 && remaining > 0 ? (
        <p className="text-xs text-[#9da39a]">
          {t("freeShippingHint", { amount: formatVnd(remaining, locale) })}
        </p>
      ) : null}
      <div className="flex justify-between border-t border-white/14 pt-3 text-base text-[#e7e9e3]">
        <span>{t("total")}</span>
        <span className="tabular-nums">{formatVnd(totalVnd, locale)}</span>
      </div>

      {hasIssues ? <p className="text-xs text-[#e0867f]">{t("fixItems")}</p> : null}

      {showCheckout ? (
        canCheckout ? (
          <Link
            href="/checkout"
            onClick={onCheckout}
            className="mt-3 block bg-[#c8d4c0] py-3 text-center text-[11px] tracking-[0.3em] text-[#080908] uppercase transition-colors hover:bg-[#e7e9e3]"
          >
            {t("checkout")}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="mt-3 block cursor-not-allowed bg-[#c8d4c0]/30 py-3 text-center text-[11px] tracking-[0.3em] text-[#080908] uppercase"
          >
            {t("checkout")}
          </span>
        )
      ) : null}
    </div>
  );
}

export { CartSummary };
