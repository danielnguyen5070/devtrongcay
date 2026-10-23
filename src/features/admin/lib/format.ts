const vnd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatVnd(value: number) {
  return vnd.format(value);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipping: "Shipping",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_LABEL: Record<string, string> = {
  cod: "COD",
  bank_transfer: "Bank transfer",
};
