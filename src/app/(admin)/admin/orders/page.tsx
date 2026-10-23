import {
  listOrders,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  OrdersTable,
  requireAdmin,
  StatusFilter,
  type OrderStatus,
} from "@/features/admin";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

function parseStatus(value: string | undefined): OrderStatus | "all" {
  if (!value || value === "all") return "all";
  if ((ORDER_STATUSES as readonly string[]).includes(value)) return value as OrderStatus;
  return "all";
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status = parseStatus(raw);
  const rows = await listOrders(status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">View and update order status.</p>
        </div>
        <StatusFilter
          current={status}
          hrefFor={(value) =>
            value === "all" ? "/admin/orders" : `/admin/orders?status=${value}`
          }
          options={[
            { value: "all", label: "All" },
            ...ORDER_STATUSES.map((value) => ({
              value,
              label: ORDER_STATUS_LABEL[value] ?? value,
            })),
          ]}
        />
      </div>
      <OrdersTable rows={rows} />
    </div>
  );
}
