"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "../lib/auth";
import {
  ORDER_STATUSES,
  type AdminOrderDetail,
  type AdminOrderListRow,
  type OrderStatus,
} from "../types";

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export async function listOrders(status?: OrderStatus | "all"): Promise<AdminOrderListRow[]> {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      "id, code, status, customer_name, phone, total_vnd, payment_method, locale, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all" && isOrderStatus(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[admin] listOrders failed", error.message, error.code ?? "");
    throw new Error("Failed to load orders.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    customerName: row.customer_name,
    phone: row.phone,
    totalVnd: row.total_vnd,
    paymentMethod: row.payment_method,
    locale: row.locale,
    createdAt: row.created_at,
  }));
}

export async function getOrder(id: string): Promise<AdminOrderDetail | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, code, status, customer_name, phone, address, note, payment_method, locale,
       subtotal_vnd, shipping_fee_vnd, total_vnd, created_at,
       items:order_items(id, product_name, unit_price_vnd, quantity, line_total_vnd)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] getOrder failed", error.message, error.code ?? "");
    throw new Error("Failed to load order.");
  }
  if (!data) return null;

  return {
    id: data.id,
    code: data.code,
    status: data.status,
    customerName: data.customer_name,
    phone: data.phone,
    address: data.address,
    note: data.note,
    paymentMethod: data.payment_method,
    locale: data.locale,
    subtotalVnd: data.subtotal_vnd,
    shippingFeeVnd: data.shipping_fee_vnd,
    totalVnd: data.total_vnd,
    createdAt: data.created_at,
    items: (data.items ?? []).map((item) => ({
      id: item.id,
      productName: item.product_name,
      unitPriceVnd: item.unit_price_vnd,
      quantity: item.quantity,
      lineTotalVnd: item.line_total_vnd,
    })),
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await requireAdmin();
  if (!isOrderStatus(status)) {
    return { ok: false as const, error: "invalid_status" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);

  if (error) {
    console.error("[admin] updateOrderStatus failed", error.message, error.code ?? "");
    return { ok: false as const, error: "update_failed" };
  }

  return { ok: true as const };
}
