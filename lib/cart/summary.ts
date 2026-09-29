import { calculateTotals, type CartTotals } from "@/lib/pricing";
import {
  getAvailability,
  type CartItemInput,
  type LineAvailability,
  type LiveProduct,
} from "@/lib/cart/types";

export type CartSummaryLine = {
  postId: string;
  quantity: number;
  /** `undefined` while the client has not loaded the post yet. */
  product: LiveProduct | null | undefined;
  availability: LineAvailability | "loading";
  lineTotalVnd: number;
};

export type CartSummaryResult = CartTotals & {
  lines: CartSummaryLine[];
  canCheckout: boolean;
};

/**
 * Availability and totals for a cart. Used by the quote endpoint, the
 * checkout action and the cart UI so they always agree. Only sellable lines
 * with enough stock contribute to totals.
 */
export function summarizeCart(
  items: CartItemInput[],
  products: Record<string, LiveProduct | null | undefined>,
): CartSummaryResult {
  const lines: CartSummaryLine[] = items.map(({ postId, quantity }) => {
    const product = products[postId];
    const availability =
      product === undefined ? "loading" : getAvailability(product, quantity);
    const lineTotalVnd =
      availability === "ok" && product?.priceVnd != null
        ? product.priceVnd * quantity
        : 0;

    return { postId, quantity, product, availability, lineTotalVnd };
  });

  const totals = calculateTotals(
    lines.flatMap((line) =>
      line.availability === "ok" && line.product?.priceVnd != null
        ? [{ unitPriceVnd: line.product.priceVnd, quantity: line.quantity }]
        : [],
    ),
  );

  return {
    ...totals,
    lines,
    canCheckout: lines.length > 0 && lines.every((line) => line.availability === "ok"),
  };
}
