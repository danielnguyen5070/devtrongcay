"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateReviewStatus } from "../api/reviews";

type Props = {
  id: string;
  status: string;
};

export function ReviewActions({ id, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: "approved" | "rejected") {
    startTransition(async () => {
      const result = await updateReviewStatus(id, next);
      if (result.ok) router.refresh();
    });
  }

  if (status !== "pending") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => setStatus("approved")}
        className="border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setStatus("rejected")}
        className="border border-border px-2 py-1 text-xs text-destructive hover:bg-accent disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
