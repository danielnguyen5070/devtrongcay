import Link from "next/link";
import { formatDateTime, REVIEW_STATUS_LABEL } from "../lib/format";
import type { AdminReviewRow } from "../types";
import { ReviewActions } from "./review-actions";

type Props = {
  rows: AdminReviewRow[];
};

export function ReviewsTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews.</p>;
  }

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-secondary text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Plant</th>
            <th className="px-3 py-2 font-medium">Author</th>
            <th className="px-3 py-2 font-medium">Rating</th>
            <th className="px-3 py-2 font-medium">Comment</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Submitted</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border align-top">
              <td className="px-3 py-2">
                {row.postSlug ? (
                  <Link
                    href={`/${row.locale}/blog/${row.postSlug}`}
                    className="underline-offset-2 hover:underline"
                    target="_blank"
                  >
                    {row.postTitle ?? row.postSlug}
                  </Link>
                ) : (
                  (row.postTitle ?? "—")
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{row.authorName}</td>
              <td className="px-3 py-2">{row.rating}</td>
              <td className="max-w-xs px-3 py-2 text-muted-foreground">{row.comment}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {REVIEW_STATUS_LABEL[row.status] ?? row.status}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                {formatDateTime(row.createdAt)}
              </td>
              <td className="px-3 py-2">
                <ReviewActions id={row.id} status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
