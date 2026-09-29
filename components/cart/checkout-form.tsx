"use client";

import { startTransition, useActionState, useEffect, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { placeOrder } from "@/app/[locale]/checkout/actions";
import { initialPlaceOrderState, type CheckoutField } from "@/app/[locale]/checkout/state";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cart/store";
import { useCartSummary } from "@/lib/cart/use-cart-summary";
import { CartLine } from "./cart-line";
import { CartSummary } from "./cart-summary";

const inputClass =
  "mt-2 w-full border border-white/14 bg-transparent px-3 py-2.5 text-sm text-[#e7e9e3] outline-none transition-colors placeholder:text-[#9da39a]/60 focus:border-white/40 aria-invalid:border-[#e0867f]";
const labelClass = "block text-[11px] tracking-[0.24em] text-[#9da39a] uppercase";

function CheckoutForm() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const summary = useCartSummary();
  const [state, dispatch, pending] = useActionState(placeOrder, initialPlaceOrderState);

  useEffect(() => {
    const { clearCart, upsertProducts } = useCartStore.getState();
    if (state.status === "success") clearCart();
    if (state.status === "error" && state.products) upsertProducts(state.products);
  }, [state]);

  if (state.status === "success") {
    return (
      <section className="mt-10 border-t border-white/14 pt-10" aria-live="polite">
        <h2 className="font-heading text-2xl text-[#e7e9e3]">{t("successTitle")}</h2>
        <p className="mt-4 text-[#c4c9c0]">
          {t("successCode", { code: state.code })}
        </p>
        <p className="mt-2 text-sm text-[#9da39a]">{t("successNote")}</p>
        <Link
          href="/"
          className="mt-8 inline-block text-[11px] tracking-[0.3em] text-[#9da39a] uppercase hover:text-[#e7e9e3]"
        >
          {t("back")}
        </Link>
      </section>
    );
  }

  if (!hydrated) return null;

  if (items.length === 0) {
    return <p className="mt-10 text-sm text-[#9da39a]">{t("empty")}</p>;
  }

  const invalid = (field: CheckoutField) =>
    state.status === "error" && state.fields?.includes(field) ? true : undefined;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("locale", locale);
    formData.set(
      "items",
      JSON.stringify(
        useCartStore.getState().items.map(({ postId, quantity }) => ({ postId, quantity })),
      ),
    );
    startTransition(() => dispatch(formData));
  }

  return (
    <div className="mt-10 grid gap-12 border-t border-white/14 pt-10">
      <section aria-labelledby="checkout-summary">
        <h2 id="checkout-summary" className={labelClass}>
          {t("summary")}
        </h2>
        <ul className="mt-2">
          {summary.lines.map((line) => (
            <CartLine key={line.postId} line={line} />
          ))}
        </ul>
        <CartSummary summary={summary} showCheckout={false} className="mt-5" />
      </section>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <h2 className={labelClass}>{t("contact")}</h2>

        <FieldError show={invalid("name")} message={t("errors.name")}>
          <label className={labelClass}>
            {t("name")}
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              aria-invalid={invalid("name")}
              className={inputClass}
            />
          </label>
        </FieldError>

        <FieldError show={invalid("phone")} message={t("errors.phone")}>
          <label className={labelClass}>
            {t("phone")}
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={20}
              aria-invalid={invalid("phone")}
              className={inputClass}
            />
          </label>
        </FieldError>

        <FieldError show={invalid("address")} message={t("errors.address")}>
          <label className={labelClass}>
            {t("address")}
            <textarea
              name="address"
              autoComplete="street-address"
              required
              rows={3}
              maxLength={500}
              aria-invalid={invalid("address")}
              className={inputClass}
            />
          </label>
        </FieldError>

        <FieldError show={invalid("note")} message={t("errors.note")}>
          <label className={labelClass}>
            {t("note")}
            <textarea
              name="note"
              rows={2}
              maxLength={1000}
              aria-invalid={invalid("note")}
              className={inputClass}
            />
          </label>
        </FieldError>

        <FieldError show={invalid("paymentMethod")} message={t("errors.paymentMethod")}>
          <fieldset>
            <legend className={labelClass}>{t("paymentMethod")}</legend>
            <div className="mt-3 space-y-2 text-sm text-[#e7e9e3]">
              <label className="flex items-center gap-3">
                <input type="radio" name="paymentMethod" value="cod" defaultChecked />
                {t("cod")}
              </label>
              <label className="flex items-center gap-3">
                <input type="radio" name="paymentMethod" value="bank_transfer" />
                {t("bankTransfer")}
              </label>
            </div>
          </fieldset>
        </FieldError>

        {state.status === "error" ? (
          <p role="alert" className="text-sm text-[#e0867f]">
            {t(`errors.${state.error}`)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !summary.canCheckout}
          className="w-full bg-[#c8d4c0] py-3.5 text-[11px] tracking-[0.3em] text-[#080908] uppercase transition-colors hover:bg-[#e7e9e3] disabled:cursor-not-allowed disabled:bg-[#c8d4c0]/30"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}

function FieldError({
  show,
  message,
  children,
}: {
  show: boolean | undefined;
  message: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
      {show ? <p className="mt-1.5 text-xs text-[#e0867f]">{message}</p> : null}
    </div>
  );
}

export { CheckoutForm };
