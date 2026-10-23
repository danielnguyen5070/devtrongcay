/** The only place pricing rules live. Safe to import on client and server. */

export const FREE_SHIPPING_THRESHOLD_VND = 500_000;
export const SHIPPING_FEE_VND = 50_000;

export type PricedLine = {
  unitPriceVnd: number;
  quantity: number;
};

export type CartTotals = {
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
};

export function calculateShippingFee(subtotalVnd: number) {
  if (subtotalVnd <= 0) return 0;
  return subtotalVnd >= FREE_SHIPPING_THRESHOLD_VND ? 0 : SHIPPING_FEE_VND;
}

export function calculateTotals(lines: PricedLine[]): CartTotals {
  const subtotalVnd = lines.reduce(
    (sum, line) => sum + line.unitPriceVnd * line.quantity,
    0,
  );
  const shippingFeeVnd = calculateShippingFee(subtotalVnd);

  return { subtotalVnd, shippingFeeVnd, totalVnd: subtotalVnd + shippingFeeVnd };
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatVnd(amount: number, locale: string) {
  const tag = locale === "vi" ? "vi-VN" : "en-US";
  let formatter = formatters.get(tag);
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
    formatters.set(tag, formatter);
  }

  return formatter.format(amount);
}
