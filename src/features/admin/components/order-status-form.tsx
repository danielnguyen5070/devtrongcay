"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateOrderStatus } from "../api/orders";
import { ORDER_STATUS_LABEL } from "../lib/format";
import { ORDER_STATUSES, type OrderStatus } from "../types";

type Props = {
  id: string;
  status: OrderStatus;
};

export function OrderStatusForm({ id, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">Update status</span>
      <select
        defaultValue={status}
        disabled={pending}
        className="max-w-xs border border-border bg-card px-3 py-2 outline-none focus:border-ring disabled:opacity-60"
        onChange={(event) => {
          const next = event.target.value as OrderStatus;
          startTransition(async () => {
            const result = await updateOrderStatus(id, next);
            if (result.ok) router.refresh();
          });
        }}
      >
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABEL[value] ?? value}
          </option>
        ))}
      </select>
    </label>
  );
}
