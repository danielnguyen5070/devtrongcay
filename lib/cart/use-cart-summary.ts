"use client";

import { useMemo } from "react";
import { useCartStore } from "@/lib/cart/store";
import { summarizeCart } from "@/lib/cart/summary";

export function useCartSummary() {
  const items = useCartStore((state) => state.items);
  const products = useCartStore((state) => state.products);

  return useMemo(() => summarizeCart(items, products), [items, products]);
}
