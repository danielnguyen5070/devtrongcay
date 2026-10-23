import {
  listReviews,
  REVIEW_STATUS_LABEL,
  REVIEW_STATUSES,
  requireAdmin,
  ReviewsTable,
  StatusFilter,
  type ReviewStatus,
} from "@/features/admin";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

function parseStatus(value: string | undefined): ReviewStatus {
  if (value && (REVIEW_STATUSES as readonly string[]).includes(value)) {
    return value as ReviewStatus;
  }
  return "pending";
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status = parseStatus(raw);
  const rows = await listReviews(status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Approve or reject guest reviews.</p>
        </div>
        <StatusFilter
          current={status}
          hrefFor={(value) =>
            value === "pending" ? "/admin/reviews" : `/admin/reviews?status=${value}`
          }
          options={REVIEW_STATUSES.map((value) => ({
            value,
            label: REVIEW_STATUS_LABEL[value] ?? value,
          }))}
        />
      </div>
      <ReviewsTable rows={rows} />
    </div>
  );
}
