"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/lib/cart/store";
import { useCartSummary } from "@/lib/cart/use-cart-summary";
import { CartLine } from "./cart-line";
import { CartSummary } from "./cart-summary";
import { CloseIcon } from "./icons";

function CartDrawer() {
  const t = useTranslations("cart");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = useCartStore((state) => state.isOpen);
  const close = useCartStore((state) => state.close);
  const summary = useCartSummary();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cart-drawer-title"
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="cart-drawer"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-white/14 px-5 py-4">
          <h2
            id="cart-drawer-title"
            className="text-[11px] tracking-[0.3em] text-[#d6dad2] uppercase"
          >
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="grid size-8 place-items-center text-[#9da39a] transition-colors hover:text-[#e7e9e3]"
          >
            <CloseIcon className="size-4" />
          </button>
        </header>

        {summary.lines.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[#9da39a]">{t("empty")}</p>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5">
              {summary.lines.map((line) => (
                <CartLine key={line.postId} line={line} onNavigate={close} />
              ))}
            </ul>
            <CartSummary
              summary={summary}
              onCheckout={close}
              className="border-t border-white/14 px-5 py-5"
            />
          </>
        )}
      </div>
    </dialog>
  );
}

export { CartDrawer };
