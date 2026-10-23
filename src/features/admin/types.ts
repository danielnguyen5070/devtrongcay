import type { Database } from "@/lib/supabase/database.types";

export type ReviewStatus = Database["public"]["Enums"]["review_status"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type AppLocale = Database["public"]["Enums"]["app_locale"];

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const satisfies readonly ReviewStatus[];
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipping",
  "completed",
  "cancelled",
] as const satisfies readonly OrderStatus[];

export type AdminReviewRow = {
  id: string;
  postId: string;
  postSlug: string | null;
  postTitle: string | null;
  locale: AppLocale;
  authorName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
};

export type AdminOrderListRow = {
  id: string;
  code: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  totalVnd: number;
  paymentMethod: PaymentMethod;
  locale: AppLocale;
  createdAt: string;
};

export type AdminOrderItem = {
  id: string;
  productName: string;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
};

export type AdminOrderDetail = AdminOrderListRow & {
  address: string;
  note: string;
  subtotalVnd: number;
  shippingFeeVnd: number;
  items: AdminOrderItem[];
};
