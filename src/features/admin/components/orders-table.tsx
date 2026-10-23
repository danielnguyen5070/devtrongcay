import Link from "next/link";
import { formatDateTime, formatVnd, ORDER_STATUS_LABEL, PAYMENT_LABEL } from "../lib/format";
import type { AdminOrderListRow } from "../types";

type Props = {
  rows: AdminOrderListRow[];
};

export function OrdersTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No orders.</p>;
  }

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-secondary text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium">Customer</th>
            <th className="px-3 py-2 font-medium">Phone</th>
            <th className="px-3 py-2 font-medium">Total</th>
            <th className="px-3 py-2 font-medium">Payment</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Placed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border">
              <td className="px-3 py-2">
                <Link href={`/admin/orders/${row.id}`} className="font-medium hover:underline">
                  {row.code}
                </Link>
              </td>
              <td className="px-3 py-2">{row.customerName}</td>
              <td className="px-3 py-2 whitespace-nowrap">{row.phone}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatVnd(row.totalVnd)}</td>
              <td className="px-3 py-2">
                {PAYMENT_LABEL[row.paymentMethod] ?? row.paymentMethod}
              </td>
              <td className="px-3 py-2">
                {ORDER_STATUS_LABEL[row.status] ?? row.status}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                {formatDateTime(row.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
