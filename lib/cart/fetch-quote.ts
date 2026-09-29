import type { CartQuote } from "@/lib/cart/quote";
import type { CartItemInput } from "@/lib/cart/types";

/** Calls POST /api/cart/quote. Returns null on any failure. */
export async function fetchQuote(
  items: CartItemInput[],
  locale: string,
  signal?: AbortSignal,
): Promise<CartQuote | null> {
  try {
    const response = await fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, locale }),
      signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as CartQuote;
  } catch (error) {
    if (!signal?.aborted) console.error("[cart] Quote failed", error);
    return null;
  }
}

export function quoteProducts(quote: CartQuote) {
  return Object.fromEntries(quote.lines.map((line) => [line.postId, line.product]));
}
