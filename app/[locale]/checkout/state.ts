import type { LiveProduct } from "@/lib/cart/types";

export type CheckoutField = "name" | "phone" | "address" | "note" | "paymentMethod";

export type CheckoutError =
  | "invalid"
  | "empty_cart"
  | "cart_changed"
  | "unavailable"
  | "insufficient_stock"
  | "price_changed"
  | "generic";

export type PlaceOrderState =
  | { status: "idle" }
  | { status: "success"; code: string }
  | {
      status: "error";
      error: CheckoutError;
      fields?: CheckoutField[];
      /** Fresh server data so the cart can flag the lines that changed. */
      products?: Record<string, LiveProduct | null>;
    };

export const initialPlaceOrderState: PlaceOrderState = { status: "idle" };
