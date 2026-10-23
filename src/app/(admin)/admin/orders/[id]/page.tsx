import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatDateTime,
  formatVnd,
  getOrder,
  ORDER_STATUS_LABEL,
  OrderStatusForm,
  PAYMENT_LABEL,
  requireAdmin,
} from "@/features/admin";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← Orders
        </Link>
        <h1 className="text-xl font-semibold">{order.code}</h1>
        <p className="text-sm text-muted-foreground">
          {ORDER_STATUS_LABEL[order.status] ?? order.status} · {formatDateTime(order.createdAt)}
        </p>
      </div>

      <OrderStatusForm id={order.id} status={order.status} />

      <section className="grid gap-4 border border-border p-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Customer</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="inline text-muted-foreground">Name: </dt>
              <dd className="inline">{order.customerName}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Phone: </dt>
              <dd className="inline">{order.phone}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Address: </dt>
              <dd className="inline">{order.address}</dd>
            </div>
            {order.note ? (
              <div>
                <dt className="inline text-muted-foreground">Note: </dt>
                <dd className="inline">{order.note}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Payment</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="inline text-muted-foreground">Method: </dt>
              <dd className="inline">
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Locale: </dt>
              <dd className="inline">{order.locale}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Subtotal: </dt>
              <dd className="inline">{formatVnd(order.subtotalVnd)}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Shipping: </dt>
              <dd className="inline">{formatVnd(order.shippingFeeVnd)}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Total: </dt>
              <dd className="inline font-medium">{formatVnd(order.totalVnd)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Items</h2>
        <div className="overflow-x-auto border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-border bg-secondary text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Unit price</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="px-3 py-2">{item.productName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatVnd(item.unitPriceVnd)}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatVnd(item.lineTotalVnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
