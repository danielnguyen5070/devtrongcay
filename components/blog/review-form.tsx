"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitReview } from "@/app/[locale]/blog/[slug]/actions";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_NAME_MAX,
  initialSubmitReviewState,
  type ReviewField,
} from "@/app/[locale]/blog/[slug]/state";
import { Star } from "./star-rating";

const inputClass =
  "mt-2 w-full border border-white/14 bg-transparent px-3 py-2.5 text-sm text-[#e7e9e3] outline-none transition-colors placeholder:text-[#9da39a]/60 focus:border-white/40 aria-invalid:border-[#e0867f]";
const labelClass = "block text-[11px] tracking-[0.24em] text-[#9da39a] uppercase";

function ReviewFormBody({ slug, onReset }: { slug: string; onReset: () => void }) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const [state, dispatch, pending] = useActionState(submitReview, initialSubmitReviewState);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  if (state.status === "success") {
    return (
      <div aria-live="polite" className="mt-6">
        <p className="font-heading text-xl text-[#e7e9e3]">{t("successTitle")}</p>
        <p className="mt-2 text-sm text-[#9da39a]">{t("successNote")}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 text-[11px] tracking-[0.3em] text-[#9da39a] uppercase transition-colors hover:text-[#e7e9e3]"
        >
          {t("writeAnother")}
        </button>
      </div>
    );
  }

  const invalid = (field: ReviewField) =>
    state.status === "error" && state.fields?.includes(field) ? true : undefined;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("locale", locale);
    formData.set("slug", slug);
    startTransition(() => dispatch(formData));
  }

  const shown = hovered || rating;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      <FieldError show={invalid("rating")} message={t("errors.rating")}>
        <fieldset>
          <legend className={labelClass}>{t("rating")}</legend>
          <div className="mt-2 flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                onMouseEnter={() => setHovered(value)}
                className="cursor-pointer p-0.5 has-focus-visible:outline has-focus-visible:outline-white/40"
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                />
                <span className="sr-only">{t("ratingOption", { rating: value })}</span>
                <Star filled={value <= shown} className="size-6" />
              </label>
            ))}
          </div>
        </fieldset>
      </FieldError>

      <FieldError show={invalid("name")} message={t("errors.name")}>
        <label className={labelClass}>
          {t("name")}
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={REVIEW_NAME_MAX}
            aria-invalid={invalid("name")}
            className={inputClass}
          />
        </label>
      </FieldError>

      <FieldError show={invalid("comment")} message={t("errors.comment")}>
        <label className={labelClass}>
          {t("comment")}
          <textarea
            name="comment"
            required
            rows={4}
            maxLength={REVIEW_COMMENT_MAX}
            aria-invalid={invalid("comment")}
            className={inputClass}
          />
        </label>
      </FieldError>

      <label aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        {t("honeypot")}
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-[#e0867f]">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#c8d4c0] py-3.5 text-[11px] tracking-[0.3em] text-[#080908] uppercase transition-colors hover:bg-[#e7e9e3] disabled:cursor-not-allowed disabled:bg-[#c8d4c0]/30"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function ReviewForm({ slug }: { slug: string }) {
  const [formKey, setFormKey] = useState(0);
  return (
    <ReviewFormBody key={formKey} slug={slug} onReset={() => setFormKey((key) => key + 1)} />
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

export { ReviewForm };
