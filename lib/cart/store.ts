import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  MAX_CART_LINES,
  clampQuantity,
  type CartItem,
  type LiveProduct,
} from "@/lib/cart/types";

export const CART_STORAGE_KEY = "dtc-cart-v1";

type CartState = {
  /** Persisted. */
  items: CartItem[];
  /** In memory only. `null` = post missing or unpublished. */
  products: Record<string, LiveProduct | null>;
  /** Bumped to ask CartSync for a fresh quote. */
  quoteNonce: number;
  hydrated: boolean;
  isOpen: boolean;

  addItem: (postId: string, quantity?: number) => void;
  removeItem: (postId: string) => void;
  setQuantity: (postId: string, quantity: number) => void;
  increment: (postId: string) => void;
  decrement: (postId: string) => void;
  clearCart: () => void;

  upsertProducts: (products: Record<string, LiveProduct | null>) => void;
  /** Returns false when the post is not loaded, so the caller can re-quote. */
  patchProduct: (postId: string, patch: Partial<LiveProduct>) => boolean;
  requestQuote: () => void;
  open: () => void;
  close: () => void;
};

type PersistedCart = Pick<CartState, "items">;

function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const items: CartItem[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const { postId, quantity, addedAt } = raw as Record<string, unknown>;
    if (typeof postId !== "string" || seen.has(postId)) continue;
    if (typeof quantity !== "number") continue;

    seen.add(postId);
    items.push({
      postId,
      quantity: clampQuantity(quantity),
      addedAt: typeof addedAt === "number" ? addedAt : Date.now(),
    });
  }

  return items.slice(0, MAX_CART_LINES);
}

/**
 * Quantities are only capped at MAX_ITEM_QUANTITY. Stock never lowers a
 * quantity; the UI flags the line and the customer fixes it.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      products: {},
      quoteNonce: 0,
      hydrated: false,
      isOpen: false,

      addItem: (postId, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.postId === postId);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.postId === postId
                  ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
                  : item,
              ),
            };
          }
          if (state.items.length >= MAX_CART_LINES) return state;

          return {
            items: [
              ...state.items,
              { postId, quantity: clampQuantity(quantity), addedAt: Date.now() },
            ],
          };
        }),

      removeItem: (postId) =>
        set((state) => ({
          items: state.items.filter((item) => item.postId !== postId),
        })),

      setQuantity: (postId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.postId === postId ? { ...item, quantity: clampQuantity(quantity) } : item,
          ),
        })),

      increment: (postId) => {
        const item = get().items.find((entry) => entry.postId === postId);
        if (item) get().setQuantity(postId, item.quantity + 1);
      },

      decrement: (postId) => {
        const item = get().items.find((entry) => entry.postId === postId);
        if (item) get().setQuantity(postId, item.quantity - 1);
      },

      clearCart: () => set({ items: [] }),

      upsertProducts: (products) =>
        set((state) => ({ products: { ...state.products, ...products } })),

      patchProduct: (postId, patch) => {
        const current = get().products[postId];
        if (!current) return false;
        set((state) => ({
          products: { ...state.products, [postId]: { ...current, ...patch } },
        }));
        return true;
      },

      requestQuote: () => set((state) => ({ quoteNonce: state.quoteNonce + 1 })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state): PersistedCart => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: sanitizeItems((persisted as Partial<PersistedCart> | undefined)?.items),
      }),
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hydrated: true });
      },
    },
  ),
);

export function selectItemCount(state: CartState) {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}
