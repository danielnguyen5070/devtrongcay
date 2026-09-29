"use client";

import { useTranslations } from "next-intl";
import { selectItemCount, useCartStore } from "@/lib/cart/store";
import { BagIcon } from "./icons";

function CartButton() {
  const t = useTranslations("cart");
  const count = useCartStore(selectItemCount);
  const open = useCartStore((state) => state.open);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t("open", { count })}
      className="cart-button"
    >
      <BagIcon className="size-4" />
      {count > 0 ? <span className="tabular-nums">{count}</span> : null}
    </button>
  );
}

export { CartButton };
