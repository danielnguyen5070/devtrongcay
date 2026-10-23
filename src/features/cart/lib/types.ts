import type { Database } from "@/types/database";

export const MAX_ITEM_QUANTITY = 10;
export const MAX_CART_LINES = 50;

export type ProductStatus = Database["public"]["Enums"]["product_status"];

/** What the cart persists. Never add prices or totals here. */
export type CartItem = {
  postId: string;
  quantity: number;
  addedAt: number;
};

export type CartItemInput = Pick<CartItem, "postId" | "quantity">;

/** Current sale data for a post, from the quote endpoint or Realtime. */
export type LiveProduct = {
  postId: string;
  slug: string;
  title: string;
  coverImage: string;
  priceVnd: number | null;
  stock: number;
  productStatus: ProductStatus;
  published: boolean;
};

export type LineAvailability =
  | "ok"
  | "insufficient_stock"
  | "out_of_stock"
  | "unavailable";

export function isSellable(product: LiveProduct | null | undefined) {
  return Boolean(
    product &&
      product.published &&
      product.productStatus === "active" &&
      product.priceVnd !== null,
  );
}

/** `null` means the post no longer exists or is not published. */
export function getAvailability(
  product: LiveProduct | null,
  quantity: number,
): LineAvailability {
  if (!product || !isSellable(product)) return "unavailable";
  if (product.stock <= 0) return "out_of_stock";
  if (product.stock < quantity) return "insufficient_stock";
  return "ok";
}

export function clampQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.trunc(quantity)));
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates untrusted cart input. Returns null when anything is malformed. */
export function parseCartItems(input: unknown): CartItemInput[] | null {
  if (!Array.isArray(input) || input.length > MAX_CART_LINES) return null;

  const seen = new Set<string>();
  const items: CartItemInput[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const { postId, quantity } = raw as Record<string, unknown>;

    if (typeof postId !== "string" || !UUID_PATTERN.test(postId)) return null;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ITEM_QUANTITY
    ) {
      return null;
    }
    if (seen.has(postId)) return null;

    seen.add(postId);
    items.push({ postId: postId.toLowerCase(), quantity });
  }

  return items;
}
