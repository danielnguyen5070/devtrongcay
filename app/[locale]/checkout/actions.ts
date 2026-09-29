"use server";

import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { quoteCart, type CartQuote } from "@/lib/cart/quote";
import { parseCartItems } from "@/lib/cart/types";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { CheckoutError, CheckoutField, PlaceOrderState } from "./state";

const PAYMENT_METHODS = ["cod", "bank_transfer"] as const;
const RPC_ERRORS = ["unavailable", "insufficient_stock", "price_changed"] as const;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Accepts 0xxxxxxxxx, 84xxxxxxxxx or +84xxxxxxxxx; returns 0xxxxxxxxx. */
function normalizePhone(value: string) {
  const compact = value.replace(/[\s.\-()]/g, "");
  const match = /^(?:\+84|84|0)([35789]\d{8})$/.exec(compact);
  return match ? `0${match[1]}` : null;
}

function productsOf(quote: CartQuote) {
  return Object.fromEntries(quote.lines.map((line) => [line.postId, line.product]));
}

/**
 * Never trusts client prices, stock or totals: only postId + quantity are
 * read from the cart. Stock is re-checked under row locks in place_order.
 */
export async function placeOrder(
  _previous: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const rawLocale = text(formData, "locale");
  const locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale;

  const customerName = text(formData, "name");
  const phone = normalizePhone(text(formData, "phone"));
  const address = text(formData, "address");
  const note = text(formData, "note");
  const paymentMethod = text(formData, "paymentMethod");

  const fields: CheckoutField[] = [];
  if (!customerName || customerName.length > 120) fields.push("name");
  if (!phone) fields.push("phone");
  if (!address || address.length > 500) fields.push("address");
  if (note.length > 1000) fields.push("note");
  if (!PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])) {
    fields.push("paymentMethod");
  }
  if (fields.length > 0) return { status: "error", error: "invalid", fields };

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(text(formData, "items") || "[]");
  } catch {
    rawItems = null;
  }
  const items = parseCartItems(rawItems);
  if (!items || items.length === 0) return { status: "error", error: "empty_cart" };

  let quote: CartQuote;
  try {
    quote = await quoteCart(items, locale);
  } catch {
    return { status: "error", error: "generic" };
  }

  if (!quote.canCheckout) {
    return { status: "error", error: "cart_changed", products: productsOf(quote) };
  }

  const lines = quote.lines.flatMap((line) =>
    line.product && line.product.priceVnd !== null
      ? [
          {
            post_id: line.postId,
            product_name: line.product.title,
            unit_price_vnd: line.product.priceVnd,
            quantity: line.quantity,
          },
        ]
      : [],
  );

  const { data: code, error } = await getAdminSupabase().rpc("place_order", {
    p_customer: {
      customer_name: customerName,
      phone,
      address,
      note,
      payment_method: paymentMethod,
      locale,
    },
    p_lines: lines,
    p_subtotal_vnd: quote.subtotalVnd,
    p_shipping_fee_vnd: quote.shippingFeeVnd,
    p_total_vnd: quote.totalVnd,
  });

  if (error || !code) {
    const known = RPC_ERRORS.find((name) => name === error?.message);
    if (!known) {
      console.error("[checkout] place_order failed", error?.message, error?.code ?? "");
      return { status: "error", error: "generic" };
    }

    const fresh = await quoteCart(items, locale).catch(() => null);
    return {
      status: "error",
      error: known satisfies CheckoutError,
      products: fresh ? productsOf(fresh) : undefined,
    };
  }

  return { status: "success", code };
}
