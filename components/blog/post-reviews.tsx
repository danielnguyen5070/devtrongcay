import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/date";
import type { PostReviewSummary } from "@/types/blog";
import { ReviewForm } from "./review-form";
import { StarRating } from "./star-rating";

type PostReviewsProps = {
  locale: string;
  slug: string;
  summary: PostReviewSummary;
};

async function PostReviews({ locale, slug, summary }: PostReviewsProps) {
  const t = await getTranslations({ locale, namespace: "reviews" });
  const average = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(summary.average);

  return (
    <section aria-labelledby="post-reviews" className="mt-16 border-t border-white/14 pt-10">
      <h2
        id="post-reviews"
        className="font-heading text-2xl font-normal tracking-tight text-[#e7e9e3]"
      >
        {t("title")}
      </h2>

      {summary.count > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StarRating
            value={summary.average}
            label={t("stars", { rating: average })}
          />
          <p className="text-sm text-[#9da39a]">
            {t("summary", { average, count: summary.count })}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#9da39a]">{t("empty")}</p>
      )}

      {summary.count > 0 ? (
        <ul className="mt-8 divide-y divide-white/10">
          {summary.reviews.map((review) => (
            <li key={review.id} className="py-6 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#e7e9e3]">{review.authorName}</p>
                <time
                  dateTime={review.createdAt}
                  className="text-[11px] tracking-[0.24em] text-[#9da39a] uppercase"
                >
                  {formatDate(review.createdAt, locale)}
                </time>
              </div>
              <StarRating
                value={review.rating}
                label={t("stars", { rating: review.rating })}
                className="mt-2"
              />
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-[#c4c9c0]">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-12 border-t border-white/14 pt-10">
        <h3 className="text-[11px] tracking-[0.3em] text-[#9da39a] uppercase">
          {t("formTitle")}
        </h3>
        <ReviewForm slug={slug} />
      </div>
    </section>
  );
}

export { PostReviews };
